import { soloTenant } from '../../../core/tenancy/tenant-context.js';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { InteraccionResponseDto } from '../dto/interaccion-response.dto.js';
import { PromptDto } from '../dto/prompt.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import type { ReporteHibridoResponseDto } from '../dto/reporte-hibrido-response.dto.js';
import { InteraccionIa, TipoInteraccion } from '../entities/interaccion-ia.entity.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
import { ConsultaNoComprendidaException } from '../exception/consulta-no-comprendida.exception.js';
import { IaNoConfiguradaException } from '../exception/ia-no-configurada.exception.js';
import { SinSucursalAsignadaException } from '../exception/sin-sucursal-asignada.exception.js';
import { CATALOGO_METRICAS } from './catalogo-metricas.js';
import { IaAgenteService } from './ia-agente.service.js';
import { MotorConsultaService } from './motor-consulta.service.js';
import { PROVEEDOR_IA, type ProveedorIa } from './proveedor-ia/proveedor-ia.interface.js';

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);

  constructor(
    private readonly motor: MotorConsultaService,
    @Inject(PROVEEDOR_IA) private readonly proveedor: ProveedorIa,
    @InjectRepository(InteraccionIa) private readonly interacciones: Repository<InteraccionIa>,
    @Optional() private readonly agente?: IaAgenteService,
  ) {}

  async consultar(ficha: FichaConsultaDto, user: JwtPayload): Promise<ReporteResponseDto> {
    const fichaEfectiva = this.forzarAlcance(ficha, user);
    const filas = await this.motor.ejecutar(fichaEfectiva);
    if (!fichaEfectiva.compararCon) {
      return { ficha: fichaEfectiva, filas, comparacion: null, narrativa: null };
    }
    if (!CATALOGO_METRICAS[fichaEfectiva.metrica].permiteComparacion) {
      throw new CombinacionInvalidaException(`la metrica "${fichaEfectiva.metrica}" no admite comparacion entre periodos`);
    }

    const anteriores = await this.motor.ejecutar(fichaEfectiva, fichaEfectiva.compararCon);
    const porClave = new Map(anteriores.map((f) => [f.clave, f.valor]));
    const variaciones = filas.map((fila) => {
      const anterior = porClave.get(fila.clave) ?? 0;
      return {
        clave: fila.clave,
        etiqueta: fila.etiqueta,
        actual: fila.valor,
        anterior,
        deltaAbsoluto: fila.valor - anterior,
        deltaPorcentual: anterior === 0 ? null : Math.round(((fila.valor - anterior) / anterior) * 100),
      };
    });
    return {
      ficha: fichaEfectiva,
      filas,
      comparacion: { rango: fichaEfectiva.compararCon, filas: anteriores, variaciones },
      narrativa: null,
    };
  }

  async preguntar(dto: PromptDto, user: JwtPayload): Promise<ReporteResponseDto> {
    if (!this.proveedor.estaConfigurado()) throw new IaNoConfiguradaException();
    const crudo = await this.proveedor.extraerFicha(dto.prompt);
    const ficha = plainToInstance(FichaConsultaDto, crudo ?? {});
    const errores = validateSync(ficha, { whitelist: true, forbidNonWhitelisted: true });
    if (errores.length > 0) {
      await this.registrar(user, dto.prompt, null);
      throw new ConsultaNoComprendidaException(dto.prompt);
    }

    const reporte = await this.consultar(ficha, user);
    let narrativa: string | null = null;
    try {
      narrativa = await this.proveedor.narrar(reporte.ficha, reporte.filas, reporte.comparacion);
    } catch (error) {
      this.logger.error(`Fallo al narrar el reporte: ${String(error)}`);
    }
    await this.registrar(user, dto.prompt, narrativa);
    return { ...reporte, narrativa };
  }

  async reporteHibrido(dto: PromptDto, user: JwtPayload): Promise<ReporteHibridoResponseDto> {
    if (!this.agente) throw new IaNoConfiguradaException();
    return this.agente.ejecutar(dto.prompt, user);
  }

  private async registrar(user: JwtPayload, input: string, output: string | null): Promise<void> {
    await this.interacciones.save(this.interacciones.create({
      usuarioId: user.sub,
      tipo: TipoInteraccion.REPORTE_VOZ,
      inputText: input,
      outputText: output,
    }));
  }

  async historial(user: JwtPayload): Promise<InteraccionResponseDto[]> {
    const filas = await this.interacciones.find({
      where: user.role === 'ADMIN' ? soloTenant({}) : soloTenant({ usuarioId: user.sub }),
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return filas.map((i) => ({ id: i.id, tipo: i.tipo, inputText: i.inputText, outputText: i.outputText, createdAt: i.createdAt }));
  }

  private forzarAlcance(ficha: FichaConsultaDto, user: JwtPayload): FichaConsultaDto {
    if (user.role !== 'ENCARGADO_SUCURSAL') return ficha;
    if (!CATALOGO_METRICAS[ficha.metrica]?.filtros.sucursalId) return ficha;
    if (!user.sucursalId) throw new SinSucursalAsignadaException();
    return { ...ficha, filtros: { ...ficha.filtros, sucursalId: user.sucursalId } } as FichaConsultaDto;
  }
}
