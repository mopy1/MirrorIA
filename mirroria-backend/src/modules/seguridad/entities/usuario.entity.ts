import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

export enum RolUsuario {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  ENCARGADO_SUCURSAL = 'ENCARGADO_SUCURSAL',
  CAJERO = 'CAJERO',
  /** Dueño del SaaS: tenant_id NULL, solo opera /saas/plataforma/* y ciudades. */
  DUENO_PLATAFORMA = 'DUENO_PLATAFORMA',
}

/** Roles que cuentan para el límite de staff del plan. */
export const ROLES_STAFF = [RolUsuario.ADMIN, RolUsuario.ENCARGADO_SUCURSAL, RolUsuario.CAJERO];

@Entity('usuarios')
// Email único POR TIENDA (la misma persona puede ser clienta de dos tiendas) y
// único entre las cuentas de plataforma (tenant_id NULL no choca en un UNIQUE).
@Index(['tenantId', 'email'], { unique: true })
@Index(['email'], { unique: true, where: '"tenant_id" IS NULL' })
export class Usuario extends BaseEntity {
  // No extiende TenantBaseEntity: es la única tabla con tenant nullable
  // (NULL solo para DUENO_PLATAFORMA). FK lógica a inquilinos.id.
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId!: string | null;

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
