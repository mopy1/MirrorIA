import { describe, expect, it } from 'vitest';
import { TenantRequeridoException } from '../exception/tenant-requerido.exception.js';
import {
  type ContextoTenant, conTenant, contextoTenant, correrConContexto, soloTenant, tenantActual, tenantOpcional,
} from './tenant-context.js';

const vacio = (): ContextoTenant => ({
  headerSlug: null, tenantId: null, slug: null, nombre: null, planNombre: null, limites: null,
});

describe('tenant-context (falla cerrado)', () => {
  it('sin tienda en el contexto, tenantActual y soloTenant lanzan 400 en vez de devolver todo', () => {
    correrConContexto(vacio(), () => {
      expect(() => tenantActual()).toThrow(TenantRequeridoException);
      expect(() => soloTenant({ id: 'x' })).toThrow(TenantRequeridoException);
      expect(tenantOpcional()).toBeNull();
    });
  });

  it('sin ningún contexto (fuera de un request) también lanza', () => {
    correrConContexto(undefined as unknown as ContextoTenant, () => {
      expect(contextoTenant()).toBeUndefined();
      expect(() => tenantActual()).toThrow(TenantRequeridoException);
    });
  });

  it('soloTenant agrega el tenant al where, también a cada elemento de un OR', async () => {
    await conTenant({ tenantId: 't-a' }, async () => {
      expect(soloTenant({ id: '1' })).toEqual({ id: '1', tenantId: 't-a' });
      expect(soloTenant([{ a: 1 }, { b: 2 }])).toEqual([
        { a: 1, tenantId: 't-a' },
        { b: 2, tenantId: 't-a' },
      ]);
    });
  });

  it('conTenant anidado no pisa el contexto de afuera', async () => {
    await conTenant({ tenantId: 'afuera', slug: 'a' }, async () => {
      await conTenant({ tenantId: 'adentro' }, async () => {
        expect(tenantActual()).toBe('adentro');
        expect(contextoTenant()?.slug).toBeNull();
      });
      expect(tenantActual()).toBe('afuera');
      expect(contextoTenant()?.slug).toBe('a');
    });
  });

  it('el contexto sobrevive a los await (AsyncLocalStorage)', async () => {
    await conTenant({ tenantId: 't-x' }, async () => {
      await new Promise((r) => setTimeout(r, 5));
      expect(tenantActual()).toBe('t-x');
    });
  });
});
