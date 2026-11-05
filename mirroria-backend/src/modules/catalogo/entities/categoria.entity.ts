import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from '../../../core/database/tenant-base.entity.js';

@Entity('categorias')
@Index(['tenantId', 'slug'], { unique: true })
export class Categoria extends TenantBaseEntity {
  @ManyToOne(() => Categoria, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'padre_id' })
  padre!: Categoria | null;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ length: 120 })
  slug!: string;

  @Column({ default: true })
  activo!: boolean;
}
