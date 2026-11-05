import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Inquilino } from './inquilino.entity.js';

export const TIPOS_EVENTO = [
  'ALTA', 'SUSPENDIDA', 'REACTIVADA', 'PLAN_CAMBIADO', 'VIGENCIA_EXTENDIDA',
  'MARCA_ACTUALIZADA', 'MARCA_RESTABLECIDA', 'PAGO_REGISTRADO',
] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];
export type ActorRol = 'PLATAFORMA' | 'TIENDA' | 'SISTEMA';

/** Bitácora de la plataforma (Fase 1b): solo inserts, nunca se edita. */
@Entity('eventos_plataforma')
@Index('IDX_eventos_plataforma_inquilino_fecha', ['inquilinoId', 'createdAt'])
export class EventoPlataforma extends BaseEntity {
  @ManyToOne(() => Inquilino, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inquilino_id' })
  inquilino?: Inquilino;

  @Column({ name: 'inquilino_id', type: 'uuid' })
  inquilinoId!: string;

  @Column({ type: 'varchar', length: 30 })
  tipo!: TipoEvento;

  @Column({ type: 'varchar', length: 255, nullable: true })
  detalle!: string | null;

  /** FK lógica a usuarios.id. NULL = sistema. */
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'actor_rol', type: 'varchar', length: 20 })
  actorRol!: ActorRol;
}
