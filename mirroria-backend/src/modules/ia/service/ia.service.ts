import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { ReporteResponseDto } from '../dto/reporte-response.dto.js';
import { SinSucursalAsignadaException } from '../exception/sin-sucursal-asignada.exception.js';
import { MotorConsultaService } from './motor-consulta.service.js';

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
    return { ficha: fichaEfectiva, filas, comparacion: null, narrativa: null };
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
