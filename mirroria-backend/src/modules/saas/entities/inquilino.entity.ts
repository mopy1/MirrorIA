import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

export enum EstadoInquilino {
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
}

/** Una fila por tienda (workspace). Su id es el `tenant_id` de las 21 tablas de negocio. */
@Entity('inquilinos')
export class Inquilino extends BaseEntity {
  @Column({ length: 120 })
  nombre!: string;

  /** Inmutable en la Fase 1. Ver REGEX_SLUG y SLUGS_RESERVADOS (core/tenancy). */
  @Column({ length: 40, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 20, default: EstadoInquilino.ACTIVO })
  estado!: EstadoInquilino;

  @Column({ name: 'motivo_suspension', type: 'varchar', length: 255, nullable: true })
  motivoSuspension!: string | null;

  /** FK lógica a usuarios.id (el ADMIN que creó la tienda). */
  @Column({ name: 'propietario_id', type: 'uuid', nullable: true })
  propietarioId!: string | null;
}
