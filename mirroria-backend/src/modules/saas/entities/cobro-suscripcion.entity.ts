import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Inquilino } from './inquilino.entity.js';
import { Plan } from './plan.entity.js';

export type EstadoCobroSuscripcion = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'EXPIRADO';

/**
 * Cobros de Suscripción SaaS (Fase 2, tabla 29 del sistema).
 * Aislada de la tabla `pagos` de ventas retail B2C.
 */
@Entity('cobros_suscripcion')
@Index('idx_cobros_suscripcion_inquilino', ['inquilinoId'])
@Index('idx_cobros_suscripcion_ref_externa', ['referenciaExterna'])
@Index('idx_cobros_suscripcion_estado', ['estado'])
export class CobroSuscripcion extends BaseEntity {
  @ManyToOne(() => Inquilino, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inquilino_id' })
  inquilino?: Inquilino;

  @Column({ name: 'inquilino_id', type: 'uuid' })
  inquilinoId!: string;

  @ManyToOne(() => Plan, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan?: Plan;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @Column({ name: 'proveedor_pago', type: 'varchar', length: 30 })
  proveedorPago!: string;

  @Column({ type: 'varchar', length: 30 })
  metodo!: string;

  @Column({
    name: 'monto_cents',
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  montoCents!: number;

  @Column({ type: 'varchar', length: 30, default: 'PENDIENTE' })
  estado!: EstadoCobroSuscripcion;

  @Column({ name: 'event_id', type: 'varchar', length: 150, unique: true })
  eventId!: string;

  @Column({ name: 'referencia_externa', type: 'varchar', length: 150, nullable: true })
  referenciaExterna!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
