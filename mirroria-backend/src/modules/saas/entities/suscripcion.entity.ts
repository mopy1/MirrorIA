import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Inquilino } from './inquilino.entity.js';
import { Plan } from './plan.entity.js';

export enum EstadoSuscripcion {
  TRIAL = 'TRIAL',
  ACTIVA = 'ACTIVA',
  VENCIDA = 'VENCIDA',
  /** Reservado para la Fase 2. */
  CANCELADA = 'CANCELADA',
}

export const ESTADOS_VIGENTES = [EstadoSuscripcion.TRIAL, EstadoSuscripcion.ACTIVA];

/** Vigencia comercial de cada tienda (historial). Una sola vigente por tienda. */
@Entity('suscripciones')
@Index(['inquilino'], { unique: true, where: "estado IN ('TRIAL','ACTIVA')" })
@Index(['estado', 'fin'])
export class Suscripcion extends BaseEntity {
  @ManyToOne(() => Inquilino, { nullable: false })
  @JoinColumn({ name: 'inquilino_id' })
  inquilino!: Inquilino;

  @ManyToOne(() => Plan, { nullable: false })
  @JoinColumn({ name: 'plan_id' })
  plan!: Plan;

  @Column({ type: 'varchar', length: 20 })
  estado!: EstadoSuscripcion;

  @Column({ type: 'timestamp' })
  inicio!: Date;

  /** Hasta cuándo es vigente. */
  @Column({ type: 'timestamp' })
  fin!: Date;

  /** Precio BOB congelado al suscribirse (si después cambia el plan, no afecta). */
  @Column({
    name: 'precio_cents',
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  precioCents!: number;

  /** Hooks de la Fase 2 (WAYRA, PAYPAL, … y el id de la transacción). */
  @Column({ name: 'proveedor_pago', type: 'varchar', length: 30, nullable: true })
  proveedorPago!: string | null;

  @Column({ name: 'referencia_pago', type: 'varchar', length: 150, nullable: true })
  referenciaPago!: string | null;

  @Column({ name: 'cancelada_at', type: 'timestamp', nullable: true })
  canceladaAt!: Date | null;
}
