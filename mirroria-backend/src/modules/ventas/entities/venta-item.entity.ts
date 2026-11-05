import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from '../../../core/database/tenant-base.entity.js';
import { Venta } from './venta.entity.js';

@Entity('venta_items')
export class VentaItem extends TenantBaseEntity {
  // Venta vive en el mismo módulo -> relación real.
  @ManyToOne(() => Venta, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_id' })
  venta!: Venta;

  // Cross-módulo (catalogo) como columna simple.
  @Column({ name: 'variante_id', type: 'uuid' })
  varianteId!: string;

  @Column({ type: 'int' })
  cantidad!: number;

  @Column({
    name: 'precio_unit_cents',
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  precioUnitCents!: number;

  @Column({
    name: 'subtotal_cents',
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  subtotalCents!: number;
}
