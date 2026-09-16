import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

export enum CanalVenta {
  WEB = 'WEB',
  MOVIL = 'MOVIL',
  PRESENCIAL = 'PRESENCIAL',
}

export enum EstadoVenta {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  ENTREGADA = 'ENTREGADA',
  CANCELADA = 'CANCELADA',
  DEVUELTA_PARCIAL = 'DEVUELTA_PARCIAL',
  DEVUELTA_TOTAL = 'DEVUELTA_TOTAL',
}

@Entity('ventas')
export class Venta extends BaseEntity {
  // Todas las FK de esta entidad son cross-módulo -> columnas simples, mismo
  // criterio que el resto del proyecto. cliente_id/cajero_id nullable porque
  // una venta presencial puede no identificar al cliente, y una venta
  // digital no tiene cajero.
  @Column({ name: 'cliente_id', type: 'uuid', nullable: true })
  clienteId!: string | null;

  @Column({ name: 'sucursal_id', type: 'uuid' })
  sucursalId!: string;

  @Column({ name: 'cajero_id', type: 'uuid', nullable: true })
  cajeroId!: string | null;

  // reservas y promociones todavía no existen como módulos -> columnas sin
  // validar por ahora (ver AGENTS.md, roadmap).
  @Column({ name: 'reserva_id', type: 'uuid', nullable: true })
  reservaId!: string | null;

  @Column({ name: 'cupon_id', type: 'uuid', nullable: true })
  cuponId!: string | null;

  @Column({ type: 'varchar', length: 20 })
  canal!: CanalVenta;

  @Column({ type: 'varchar', length: 30, default: EstadoVenta.PENDIENTE })
  estado!: EstadoVenta;

  @Column({ name: 'numero_comprobante', type: 'varchar', length: 50, nullable: true })
  numeroComprobante!: string | null;

  // bigint -> number, mismo transformer que Producto.precioCents.
  @Column({
    name: 'subtotal_cents',
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  subtotalCents!: number;

  @Column({
    name: 'descuento_cents',
    type: 'bigint',
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  descuentoCents!: number;

  @Column({
    name: 'total_cents',
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  totalCents!: number;
}
