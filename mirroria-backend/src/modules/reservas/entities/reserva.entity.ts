import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

export enum EstadoReserva {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  EN_TIENDA = 'EN_TIENDA',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
  EXPIRADA = 'EXPIRADA',
  NO_SHOW = 'NO_SHOW',
}

@Entity('reservas')
export class Reserva extends BaseEntity {
  // Cross-módulo (seguridad, sucursales) como columnas simples — mismo
  // criterio que en el resto del proyecto.
  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId!: string;

  @Column({ name: 'sucursal_id', type: 'uuid' })
  sucursalId!: string;

  @Column({ type: 'varchar', length: 30, default: EstadoReserva.PENDIENTE })
  estado!: EstadoReserva;

  @Column({ name: 'fecha_hora_prevista', type: 'timestamp' })
  fechaHoraPrevista!: Date;
}
