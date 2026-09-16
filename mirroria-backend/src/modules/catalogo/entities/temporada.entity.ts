import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

@Entity('temporadas')
export class Temporada extends BaseEntity {
  @Column({ length: 100 })
  nombre!: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: string;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin!: string;

  @Column({ default: true })
  activo!: boolean;
}
