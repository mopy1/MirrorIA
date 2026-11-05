import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity.js';

/**
 * Toda tabla de negocio de una tienda extiende de esta clase (Fase 1 SaaS).
 * `tenant_id` es FK lógica a `inquilinos.id` (sin constraint: regla del monolito
 * modular). Lo completa TenantSubscriber al insertar; toda lectura filtra con soloTenant().
 */
export abstract class TenantBaseEntity extends BaseEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;
}
