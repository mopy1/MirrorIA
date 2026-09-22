import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { InteraccionResponseDto } from '../dto/interaccion-response.dto.js';
import { PromptDto } from '../dto/prompt.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import { InteraccionIa, TipoInteraccion } from '../entities/interaccion-ia.entity.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
import { ConsultaNoComprendidaException } from '../exception/consulta-no-comprendida.exception.js';
import { IaNoConfiguradaException } from '../exception/ia-no-configurada.exception.js';
import { SinSucursalAsignadaException } from '../exception/sin-sucursal-asignada.exception.js';
import { CATALOGO_METRICAS } from './catalogo-metricas.js';
import { MotorConsultaService } from './motor-consulta.service.js';
import { PROVEEDOR_IA, type ProveedorIa } from './proveedor-ia/proveedor-ia.interface.js';

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);

  constructor(
    private readonly motor: MotorConsultaService,
    @Inject(PROVEEDOR_IA) private readonly proveedor: ProveedorIa,
    @InjectRepository(InteraccionIa) private readonly interacciones: Repository<InteraccionIa>,
  ) {}

  /**
   * Corre una ficha ya armada. Sin LLM: es la via que usan las pruebas y la que
   * sigue funcionando cuando no hay IA_API_KEY.
   *
   * Un ENCARGADO_SUCURSAL queda encerrado en su sucursal: se le pisa el filtro
   * con la del JWT. Sin esto pregunta por otra sucursal y el sistema le contesta.
   */
  async consultar(ficha: FichaConsultaDto, user: JwtPayload): Promise<ReporteResponseDto> {
    const fichaEfectiva = this.forzarAlcance(ficha, user);
    const filas = await this.motor.ejecutar(fichaEfectiva);

    if (!fichaEfectiva.compararCon) {
      return { ficha: fichaEfectiva, filas, comparacion: null, narrativa: null };
    }

    if (!CATALOGO_METRICAS[fichaEfectiva.metrica].permiteComparacion) {
      throw new CombinacionInvalidaException(
        `la metrica "${fichaEfectiva.metrica}" no admite comparacion entre periodos`,
      );
    }

    // La MISMA consulta con otro rango. Asi es imposible que los dos periodos
    // se calculen distinto. Ver spec 4.5.
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
        deltaPorcentual:
          anterior === 0 ? null : Math.round(((fila.valor - anterior) / anterior) * 100),
      };
    });

    return {
      ficha: fichaEfectiva,
      filas,
      comparacion: { rango: fichaEfectiva.compararCon, filas: anteriores, variaciones },
      narrativa: null,
    };
  }

  /**
   * Camino completo de CU24. El modelo entra dos veces (traducir y narrar) y
   * NUNCA toca la base: entre medio corre el motor con SQL parametrizado.
   */
  async preguntar(dto: PromptDto, user: JwtPayload): Promise<ReporteResponseDto> {
    if (!this.proveedor.estaConfigurado()) {
      throw new IaNoConfiguradaException();
    }

    const crudo = await this.proveedor.extraerFicha(dto.prompt);
    const ficha = plainToInstance(FichaConsultaDto, crudo ?? {});
    const errores = validateSync(ficha, { whitelist: true, forbidNonWhitelisted: true });

    if (errores.length > 0) {
      // Una consulta no entendida tambien es dato de producto: se registra.
      await this.registrar(user, dto.prompt, null);
      throw new ConsultaNoComprendidaException(dto.prompt);
    }

    const reporte = await this.consultar(ficha, user);

    let narrativa: string | null = null;
    try {
      // La comparacion viaja con las filas: cuando la ficha compara dos periodos, es
      // la respuesta a la pregunta y la narrativa la ignoraba por completo.
      narrativa = await this.proveedor.narrar(reporte.ficha, reporte.filas, reporte.comparacion);
    } catch (error) {
      // Los numeros ya estan calculados y son correctos: que falle la narracion
      // no invalida el reporte. Se devuelve sin texto y se deja constancia.
      this.logger.error(`Fallo al narrar el reporte: ${String(error)}`);
    }
    await this.registrar(user, dto.prompt, narrativa);

    return { ...reporte, narrativa };
  }

  private async registrar(user: JwtPayload, input: string, output: string | null): Promise<void> {
    await this.interacciones.save(
      this.interacciones.create({
        usuarioId: user.sub,
        tipo: TipoInteraccion.REPORTE_VOZ,
        inputText: input,
        outputText: output,
      }),
    );
  }

  /**
   * Historial de consultas. Un ADMIN ve las de todos; un ENCARGADO_SUCURSAL
   * solo las propias — mismo criterio de alcance que el de los reportes.
   */
  async historial(user: JwtPayload): Promise<InteraccionResponseDto[]> {
    const filas = await this.interacciones.find({
      where: user.role === 'ADMIN' ? undefined : { usuarioId: user.sub },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return filas.map((i) => ({
      id: i.id,
      tipo: i.tipo,
      inputText: i.inputText,
      outputText: i.outputText,
      createdAt: i.createdAt,
    }));
  }

  private forzarAlcance(ficha: FichaConsultaDto, user: JwtPayload): FichaConsultaDto {
    if (user.role !== 'ENCARGADO_SUCURSAL') return ficha;

    // Metricas del dominio 'general' (cantidad_sucursales, cantidad_proveedores,
    // cantidad_categorias) no tienen concepto de sucursal — son catalogo/organizacion
    // compartidos, no datos por sucursal. Sin este chequeo, forzar sucursalId ahi
    // tira 400 ("no admite el filtro sucursalId") para CUALQUIER ENCARGADO_SUCURSAL,
    // aunque la pregunta no tenga nada sensible que acotar.
    if (!CATALOGO_METRICAS[ficha.metrica]?.filtros.sucursalId) {
      return ficha;
    }

    // Sin sucursal asignada NO se puede acotar el alcance, y dejar el filtro vacio
    // abriria TODAS las sucursales — lo contrario de lo que se busca. Se corta aca.
    if (!user.sucursalId) {
      throw new SinSucursalAsignadaException();
    }
    return {
      ...ficha,
      filtros: { ...ficha.filtros, sucursalId: user.sucursalId },
    } as FichaConsultaDto;
  }
}
