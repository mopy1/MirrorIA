import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import { SinSucursalAsignadaException } from '../exception/sin-sucursal-asignada.exception.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
import { MotorConsultaService } from './motor-consulta.service.js';
import { CATALOGO_METRICAS } from './catalogo-metricas.js';

@Injectable()
export class IaService {
  constructor(private readonly motor: MotorConsultaService) {}

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

  private forzarAlcance(ficha: FichaConsultaDto, user: JwtPayload): FichaConsultaDto {
    if (user.role !== 'ENCARGADO_SUCURSAL') return ficha;
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
