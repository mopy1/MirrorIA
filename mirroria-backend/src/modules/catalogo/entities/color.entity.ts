import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

@Entity('colores')
export class Color extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 50 })
  nombre!: string;

  @Column({ name: 'hex_code', type: 'varchar', length: 7, nullable: true })
  hexCode!: string | null;
}
