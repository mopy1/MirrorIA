import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../core/database/tenant-base.entity.js';

export enum TipoDescuentoCupon {
  PORCENTAJE = 'PORCENTAJE',
  MONTO_FIJO = 'MONTO_FIJO',
}

@Entity('cupones')
@Index(['tenantId', 'codigo'], { unique: true })
export class Cupon extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  codigo!: string;

  @Column({ name: 'tipo_descuento', type: 'varchar', length: 20 })
  tipoDescuento!: TipoDescuentoCupon;

  @Column({
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  valor!: number;

  @Column({ name: 'fecha_inicio', type: 'timestamp' })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp' })
  fechaFin!: Date;

  @Column({ name: 'usos_maximos', type: 'integer', nullable: true })
  usosMaximos!: number | null;

  @Column({ name: 'usos_actuales', type: 'integer', default: 0 })
  usosActuales!: number;

  @Column({
    name: 'monto_minimo_cents',
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | number | null) =>
        value !== null && value !== undefined ? Number(value) : null,
    },
  })
  montoMinimoCents!: number | null;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;
}
