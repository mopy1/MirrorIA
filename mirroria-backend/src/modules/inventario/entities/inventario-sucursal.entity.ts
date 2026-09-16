import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

@Entity('inventario_sucursal')
@Unique(['varianteId', 'sucursalId'])
export class InventarioSucursal extends BaseEntity {
  // FKs a variantes_producto.id y sucursales.id como columnas simples (no
  // @ManyToOne): inventario no debe depender de las entidades de catalogo ni
  // sucursales directamente — mismo criterio que Coleccion.proveedorId.
  @Column({ name: 'variante_id', type: 'uuid' })
  varianteId!: string;

  @Column({ name: 'sucursal_id', type: 'uuid' })
  sucursalId!: string;

  @Column({ name: 'cantidad_disponible', type: 'int', default: 0 })
  cantidadDisponible!: number;

  @Column({ name: 'cantidad_reservada', type: 'int', default: 0 })
  cantidadReservada!: number;

  @Column({ name: 'cantidad_en_transito', type: 'int', default: 0 })
  cantidadEnTransito!: number;
}
