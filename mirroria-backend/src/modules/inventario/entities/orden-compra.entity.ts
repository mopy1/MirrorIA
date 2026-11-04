import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

export enum EstadoOrdenCompra {
  PENDIENTE = 'PENDIENTE',
  /** Reservado: hoy ningún flujo lo asigna (no hay aviso de despacho del
   * proveedor). Se deja para no romper datos/IA; el front no lo muestra. */
  EN_TRANSITO = 'EN_TRANSITO',
  RECIBIDA_PARCIAL = 'RECIBIDA_PARCIAL',
  RECIBIDA = 'RECIBIDA',
  CANCELADA = 'CANCELADA',
}

export interface OrdenCompraItem {
  varianteId: string;
  cantidadPedida: number;
  cantidadRecibida: number;
}

@Entity('ordenes_compra')
export class OrdenCompra extends BaseEntity {
  // FKs cross-módulo (proveedores, sucursales, seguridad) como columnas
  // simples — mismo criterio que en el resto del proyecto.
  @Column({ name: 'proveedor_id', type: 'uuid' })
  proveedorId!: string;

  @Column({ name: 'sucursal_destino_id', type: 'uuid' })
  sucursalDestinoId!: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId!: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoOrdenCompra.PENDIENTE,
  })
  estado!: EstadoOrdenCompra;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  items!: OrdenCompraItem[];

  @Column({ name: 'fecha_pedido', type: 'timestamp', default: () => 'now()' })
  fechaPedido!: Date;

  @Column({ name: 'fecha_esperada', type: 'date', nullable: true })
  fechaEsperada!: string | null;

  @Column({ name: 'fecha_recepcion', type: 'timestamp', nullable: true })
  fechaRecepcion!: Date | null;
}
