import type { FichaConsultaDto } from '../../dto/ficha-consulta.dto.js';
import type { FilaReporte } from '../motor-consulta.service.js';

/** Token de inyeccion: NestJS no puede inyectar por interface de TypeScript. */
export const PROVEEDOR_IA = Symbol('PROVEEDOR_IA');

export interface ProveedorIa {
  /** Devuelve el objeto crudo del modelo. Validarlo es responsabilidad del llamador. */
  extraerFicha(texto: string): Promise<unknown>;
  narrar(ficha: FichaConsultaDto, filas: FilaReporte[]): Promise<string>;
  estaConfigurado(): boolean;
}
