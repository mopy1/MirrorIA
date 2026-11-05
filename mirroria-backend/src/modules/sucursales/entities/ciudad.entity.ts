import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

/** Global (sin tenant): geografía compartida por todas las tiendas. */
@Entity('ciudades')
@Index(['nombre', 'pais'], { unique: true })
export class Ciudad extends BaseEntity {
  @Column({ length: 100 })
  nombre!: string;

  @Column({ length: 100 })
  pais!: string;
}
