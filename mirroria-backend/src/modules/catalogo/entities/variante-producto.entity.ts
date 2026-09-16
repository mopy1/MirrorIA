import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Color } from './color.entity.js';
import { Producto } from './producto.entity.js';
import { Talla } from './talla.entity.js';

@Entity('variantes_producto')
@Unique(['producto', 'talla', 'color'])
export class VarianteProducto extends BaseEntity {
  @ManyToOne(() => Producto, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;

  @ManyToOne(() => Talla, { nullable: false })
  @JoinColumn({ name: 'talla_id' })
  talla!: Talla;

  @ManyToOne(() => Color, { nullable: false })
  @JoinColumn({ name: 'color_id' })
  color!: Color;

  @Index({ unique: true })
  @Column({ length: 60 })
  sku!: string;

  @Column({ default: true })
  activo!: boolean;
}
