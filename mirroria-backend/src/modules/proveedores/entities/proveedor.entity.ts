import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../core/database/tenant-base.entity.js';

@Entity('proveedores')
export class Proveedor extends TenantBaseEntity {
  @Column({ name: 'razon_social', length: 150 })
  razonSocial!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  nit!: string | null;

  @Column({ name: 'contacto_nombre', type: 'varchar', length: 150, nullable: true })
  contactoNombre!: string | null;

  @Column({ name: 'contacto_email', type: 'varchar', length: 150, nullable: true })
  contactoEmail!: string | null;

  @Column({ name: 'contacto_telefono', type: 'varchar', length: 30, nullable: true })
  contactoTelefono!: string | null;

  @Column({ default: true })
  activo!: boolean;
}
