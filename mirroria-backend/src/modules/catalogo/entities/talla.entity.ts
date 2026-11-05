import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../core/database/tenant-base.entity.js';

@Entity('tallas')
@Index(['tenantId', 'nombre'], { unique: true })
export class Talla extends TenantBaseEntity {
  @Column({ length: 20 })
  nombre!: string;

  @Column({ default: 0 })
  orden!: number;
}
