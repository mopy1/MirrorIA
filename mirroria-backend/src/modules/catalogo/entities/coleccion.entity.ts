import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Temporada } from './temporada.entity.js';

@Entity('colecciones')
export class Coleccion extends BaseEntity {
  @ManyToOne(() => Temporada, { nullable: false })
  @JoinColumn({ name: 'temporada_id' })
  temporada!: Temporada;

  // FK a proveedores.id como columna simple (no @ManyToOne): catalogo no debe
  // depender de la entidad del módulo proveedores — mismo criterio que
  // Usuario.sucursalId en modules/seguridad. Obligatorio (NOT NULL): toda
  // colección tiene que venir de un proveedor concreto.
  @Column({ name: 'proveedor_id', type: 'uuid' })
  proveedorId!: string;

  @Column({ length: 150 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ default: true })
  activo!: boolean;
}
