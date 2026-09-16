import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { OrdenCompra } from './orden-compra.entity.js';

export enum TipoMovimientoInventario {
  RESERVA = 'RESERVA',
  LIBERACION_RESERVA = 'LIBERACION_RESERVA',
  VENTA = 'VENTA',
  DEVOLUCION = 'DEVOLUCION',
  RECEPCION_PROVEEDOR = 'RECEPCION_PROVEEDOR',
  AJUSTE = 'AJUSTE',
}

@Entity('movimientos_inventario')
export class MovimientoInventario extends BaseEntity {
  // Cross-módulo (catalogo, sucursales) como columnas simples.
  @Column({ name: 'variante_id', type: 'uuid' })
  varianteId!: string;

  @Column({ name: 'sucursal_id', type: 'uuid' })
  sucursalId!: string;

  @Column({ name: 'tipo_movimiento', type: 'varchar', length: 30 })
  tipoMovimiento!: TipoMovimientoInventario;

  @Column({ type: 'int' })
  cantidad!: number;

  // OrdenCompra vive en el mismo módulo -> relación real. Obligatorio en la
  // práctica cuando tipoMovimiento = RECEPCION_PROVEEDOR (ver DTO).
  @ManyToOne(() => OrdenCompra, { nullable: true })
  @JoinColumn({ name: 'orden_compra_id' })
  ordenCompra!: OrdenCompra | null;

  // Cross-módulo hacia ventas (venta_items) — columna simple sin relación,
  // igual que el resto de las FKs cross-módulo, aunque ventas exista para
  // cuando esto se use: mantiene la misma regla en todo el proyecto (una
  // relación @ManyToOne solo cuando ambas entidades viven en el mismo
  // módulo). Obligatorio en la práctica cuando tipoMovimiento = VENTA o
  // DEVOLUCION.
  @Column({ name: 'venta_item_id', type: 'uuid', nullable: true })
  ventaItemId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo!: string | null;

  @Column({ name: 'referencia_doc', type: 'varchar', length: 100, nullable: true })
  referenciaDoc!: string | null;

  // Sin FK validada: es solo trazabilidad de auditoría (quién generó el
  // movimiento), no hay UsuariosService expuesto todavía por seguridad — ver
  // AGENTS.md.
  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId!: string | null;

  @Column({ type: 'timestamp', default: () => 'now()' })
  fecha!: Date;
}
