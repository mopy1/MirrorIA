import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum EstadoIdempotencia {
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADO = 'COMPLETADO',
  FALLIDO = 'FALLIDO',
}

@Entity({ name: 'idempotencia' })
@Unique('uk_idempotencia_tenant_clave', ['tenantId', 'clave'])
@Index('idx_idempotencia_tenant_clave', ['tenantId', 'clave'])
export class Idempotencia {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_idempotencia_tenant_id')
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'clave', type: 'varchar', length: 150 })
  clave!: string;

  @Column({ name: 'ruta', type: 'varchar', length: 255 })
  ruta!: string;

  @Column({ name: 'metodo', type: 'varchar', length: 10 })
  metodo!: string;

  @Column({ name: 'hash_cuerpo', type: 'varchar', length: 64 })
  hashCuerpo!: string;

  @Index('idx_idempotencia_estado')
  @Column({
    name: 'estado',
    type: 'varchar',
    length: 20,
    default: EstadoIdempotencia.EN_PROCESO,
  })
  estado!: EstadoIdempotencia;

  @Column({ name: 'codigo_estado', type: 'int', nullable: true })
  codigoEstado!: number | null;

  @Column({ name: 'cuerpo_respuesta', type: 'jsonb', nullable: true })
  cuerpoRespuesta!: Record<string, unknown> | null;

  @Index('idx_idempotencia_expira_en')
  @Column({ name: 'expira_en', type: 'timestamp' })
  expiraEn!: Date;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt!: Date;
}
