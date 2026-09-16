import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

@Entity('tallas')
export class Talla extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 20 })
  nombre!: string;

  @Column({ default: 0 })
  orden!: number;
}
