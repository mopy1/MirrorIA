import type { FichaConsultaDto } from '../../dto/ficha-consulta.dto.js';
import type { ComparacionDto } from '../../dto/reporte-response.dto.js';
import type { FilaReporte } from '../motor-consulta.service.js';

/** Token de inyeccion: NestJS no puede inyectar por interface de TypeScript. */
export const PROVEEDOR_IA = Symbol('PROVEEDOR_IA');

export interface ProveedorIa {
  /** Devuelve el objeto crudo del modelo. Validarlo es responsabilidad del llamador. */
  extraerFicha(texto: string): Promise<unknown>;
  /**
   * `null` cuando el modelo no pudo generar la narrativa (fallo de la API, no
   * texto vacio disfrazado de exito).
   *
   * `comparacion` NO es opcional por comodidad: cuando la ficha compara dos periodos,
   * la comparacion ES la respuesta a la pregunta ("¿vendi mas que el mes pasado?").
   * Sin ella el modelo redactaba sobre el periodo actual como si no existiera la otra
   * mitad de la tabla que el usuario esta mirando.
   */
  narrar(
    ficha: FichaConsultaDto,
    filas: FilaReporte[],
    comparacion?: ComparacionDto | null,
  ): Promise<string | null>;
  estaConfigurado(): boolean;
}
