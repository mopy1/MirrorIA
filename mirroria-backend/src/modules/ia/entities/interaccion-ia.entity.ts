import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

export enum TipoInteraccion {
  REPORTE_VOZ = 'REPORTE_VOZ',
}

/**
 * Log de CU24. `usuario_id` es columna simple sin relacion ORM (regla 1): apunta
 * a un ADMIN o ENCARGADO_SUCURSAL de `seguridad`, nunca a un CUSTOMER.
 * `output_text` queda nulo cuando la consulta no se pudo interpretar — una
 * pregunta no entendida tambien es dato.
 */
@Entity('interacciones_ia')
export class InteraccionIa extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId!: string;

  @Column({ name: 'tipo', type: 'varchar', length: 30, default: TipoInteraccion.REPORTE_VOZ })
  tipo!: TipoInteraccion;

  @Column({ name: 'input_text', type: 'text', nullable: true })
  inputText!: string | null;

  @Column({ name: 'output_text', type: 'text', nullable: true })
  outputText!: string | null;
}
