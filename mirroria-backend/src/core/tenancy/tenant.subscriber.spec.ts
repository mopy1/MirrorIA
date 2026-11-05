import { describe, expect, it } from 'vitest';
import type { InsertEvent, UpdateEvent } from 'typeorm';
import { conTenant, correrConContexto } from './tenant-context.js';
import { TenantSubscriber } from './tenant.subscriber.js';

const sub = new TenantSubscriber();

function metadata(conTenantId: boolean, nullable = false) {
  return {
    tableName: 'productos',
    findColumnWithPropertyName: (p: string) => (conTenantId && p === 'tenantId' ? { isNullable: nullable } : undefined),
  };
}
const insert = (entity: object, conColumna = true, nullable = false) =>
  ({ entity, metadata: metadata(conColumna, nullable) }) as unknown as InsertEvent<unknown>;
const update = (entity: object) => ({ entity, metadata: metadata(true) }) as unknown as UpdateEvent<unknown>;

describe('TenantSubscriber', () => {
  it('al insertar completa tenantId con el del contexto', async () => {
    const e: { tenantId?: string } = {};
    await conTenant({ tenantId: 't-a' }, async () => sub.beforeInsert(insert(e)));
    expect(e.tenantId).toBe('t-a');
  });

  it('no pisa un tenantId explícito', async () => {
    const e = { tenantId: 't-b' };
    await conTenant({ tenantId: 't-a' }, async () => sub.beforeInsert(insert(e)));
    expect(e.tenantId).toBe('t-b');
  });

  it('sin contexto y con columna NOT NULL lanza (es un bug, no se inserta huérfano)', () => {
    correrConContexto(
      { headerSlug: null, tenantId: null, slug: null, nombre: null, planNombre: null, limites: null },
      () => expect(() => sub.beforeInsert(insert({}))).toThrow(/Insert sin tenant en productos/),
    );
  });

  it('una columna nullable (usuarios de plataforma) o una tabla global no lanzan', () => {
    correrConContexto(
      { headerSlug: null, tenantId: null, slug: null, nombre: null, planNombre: null, limites: null },
      () => {
        expect(() => sub.beforeInsert(insert({ tenantId: null }, true, true))).not.toThrow();
        expect(() => sub.beforeInsert(insert({}, false))).not.toThrow();
      },
    );
  });

  it('beforeUpdate de una fila de otra tienda que la del contexto lanza', async () => {
    await conTenant({ tenantId: 't-a' }, async () => {
      expect(() => sub.beforeUpdate(update({ tenantId: 't-b' }))).toThrow(/Update cruzado/);
      expect(() => sub.beforeUpdate(update({ tenantId: 't-a' }))).not.toThrow();
    });
  });
});
