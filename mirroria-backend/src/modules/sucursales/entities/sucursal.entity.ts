import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Ciudad } from './ciudad.entity.js';

@Entity('sucursales')
export class Sucursal extends BaseEntity {
  // Relación real (@ManyToOne): Ciudad vive en el mismo módulo — mismo criterio
  // que Coleccion.temporada en catalogo.
  @ManyToOne(() => Ciudad, { nullable: false })
  @JoinColumn({ name: 'ciudad_id' })
  ciudad!: Ciudad;

  @Column({ length: 150 })
  nombre!: string;

  @Column({ length: 255 })
  direccion!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono!: string | null;

  @Column({ default: true })
  activo!: boolean;
}
