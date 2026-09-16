import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

@Entity('categorias')
export class Categoria extends BaseEntity {
  @ManyToOne(() => Categoria, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'padre_id' })
  padre!: Categoria | null;

  @Column({ length: 100 })
  nombre!: string;

  @Index({ unique: true })
  @Column({ length: 120 })
  slug!: string;

  @Column({ default: true })
  activo!: boolean;
}
