import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Reserva } from './reserva.entity.js';

@Entity('reserva_items')
export class ReservaItem extends BaseEntity {
  // Reserva vive en el mismo módulo -> relación real.
  @ManyToOne(() => Reserva, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reserva_id' })
  reserva!: Reserva;

  // Cross-módulo (catalogo) como columna simple.
  @Column({ name: 'variante_id', type: 'uuid' })
  varianteId!: string;

  @Column({ type: 'int' })
  cantidad!: number;
}
