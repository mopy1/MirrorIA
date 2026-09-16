import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

@Entity('ciudades')
export class Ciudad extends BaseEntity {
  @Column({ length: 100 })
  nombre!: string;

  @Column({ length: 100 })
  pais!: string;
}
