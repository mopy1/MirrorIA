import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../core/database/tenant-base.entity.js';

@Entity('colores')
@Index(['tenantId', 'nombre'], { unique: true })
export class Color extends TenantBaseEntity {
  @Column({ length: 50 })
  nombre!: string;

  @Column({ name: 'hex_code', type: 'varchar', length: 7, nullable: true })
  hexCode!: string | null;
}
