import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

export enum RolUsuario {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  ENCARGADO_SUCURSAL = 'ENCARGADO_SUCURSAL',
  CAJERO = 'CAJERO',
}

@Entity('usuarios')
export class Usuario extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 150 })
  email!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', length: 150 })
  fullName!: string;

  @Column({ type: 'varchar', length: 30, default: RolUsuario.CUSTOMER })
  role!: RolUsuario;

  // FK a sucursales.id como columna simple (no @ManyToOne): seguridad no debe
  // depender de la entidad del módulo sucursales. Obligatorio en la práctica
  // para ENCARGADO_SUCURSAL/CAJERO, null para CUSTOMER/ADMIN.
  @Column({ name: 'sucursal_id', type: 'uuid', nullable: true })
  sucursalId!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
