import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../core/database/tenant-base.entity.js';

@Entity('temporadas')
export class Temporada extends TenantBaseEntity {
  @Column({ length: 100 })
  nombre!: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: string;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin!: string;

  @Column({ default: true })
  activo!: boolean;
}
