import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

export enum ProveedorPago {
  STRIPE = 'STRIPE',
  MANUAL = 'MANUAL',
}

export enum MetodoPago {
  TARJETA = 'TARJETA',
  QR = 'QR',
  EFECTIVO = 'EFECTIVO',
}

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  REEMBOLSADO = 'REEMBOLSADO',
}

/**
 * Un intento de cobro sobre una venta. `venta_id` es columna simple sin
 * relacion ORM (regla 1): pagos no importa entidades de ventas.
 *
 * `event_id` es UNIQUE y NOT NULL a proposito: ahi vive la idempotencia. Stripe
 * reintenta los webhooks, y un evento repetido tiene que chocar contra el indice
 * en vez de cobrar dos veces. Para un cobro manual se genera `manual:<uuid>`.
 */
@Entity('pagos')
export class Pago extends BaseEntity {
  @Column({ name: 'venta_id', type: 'uuid' })
  ventaId!: string;

  @Column({ name: 'proveedor_pago', type: 'varchar', length: 30 })
  proveedorPago!: ProveedorPago;

  @Column({ name: 'metodo', type: 'varchar', length: 30 })
  metodo!: MetodoPago;

  // bigint: el driver pg lo devuelve como string sin este transformador.
  @Column({
    name: 'monto_cents',
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  montoCents!: number;

  @Column({ name: 'estado', type: 'varchar', length: 30, default: EstadoPago.PENDIENTE })
  estado!: EstadoPago;

  @Column({
    name: 'monto_reembolsado_cents',
    type: 'bigint',
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  montoReembolsadoCents!: number;

  @Column({ name: 'motivo_reembolso', type: 'varchar', length: 255, nullable: true })
  motivoReembolso!: string | null;

  @Column({ name: 'reembolsado_at', type: 'timestamp', nullable: true })
  reembolsadoAt!: Date | null;

  @Column({ name: 'event_id', type: 'varchar', length: 150, unique: true })
  eventId!: string;

  @Column({ name: 'referencia_externa', type: 'varchar', length: 150, nullable: true })
  referenciaExterna!: string | null;
}
