import { EventSubscriber, type EntitySubscriberInterface, type InsertEvent, type UpdateEvent } from 'typeorm';
import { tenantOpcional } from './tenant-context.js';

type ConTenant = { tenantId?: string | null };

/**
 * Red de seguridad de las escrituras (se registra en typeorm.config.ts):
 * - beforeInsert: completa `tenantId` con el del contexto si la entidad no lo trae.
 *   Si sigue vacío y la columna es NOT NULL, lanza (500: es un bug, no un error del usuario).
 * - beforeUpdate: guardar una entidad de otra tienda que la del contexto lanza.
 *
 * @EventSubscriber() es obligatorio: TypeORM 1.x solo instancia de `subscribers`
 * las clases decoradas (sin él, la lista se ignora en silencio).
 */
@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<unknown>): void {
    const columna = event.metadata.findColumnWithPropertyName('tenantId');
    const entidad = event.entity as ConTenant | undefined;
    if (!columna || !entidad) return;
    if (entidad.tenantId === undefined) {
      const actual = tenantOpcional();
      if (actual) entidad.tenantId = actual;
    }
    if (!entidad.tenantId && !columna.isNullable) {
      throw new Error(`Insert sin tenant en ${event.metadata.tableName}`);
    }
  }

  beforeUpdate(event: UpdateEvent<unknown>): void {
    const entidad = event.entity as ConTenant | undefined;
    const actual = tenantOpcional();
    if (!entidad?.tenantId || !actual) return;
    if (!event.metadata.findColumnWithPropertyName('tenantId')) return;
    if (entidad.tenantId !== actual) {
      throw new Error(`Update cruzado de tienda en ${event.metadata.tableName}`);
    }
  }
}
