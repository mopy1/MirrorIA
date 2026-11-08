import { describe, expect, it } from 'vitest';
import { aCentavos, cambio } from './efectivo';
import { agregarLinea, filtrarCatalogo, restarLinea, totalCents, type ItemMostrador } from './venta-caja';

const it1: ItemMostrador = { varianteId: 'v1', productoId: 'p', titulo: 'Falda Serranía', talla: 'L', color: 'Rosa', sku: 'F-L', precioCents: 43000, disponible: 2 };
const it2: ItemMostrador = { ...it1, varianteId: 'v2', titulo: 'Abrigo de lana', talla: 'M', color: 'Beige', sku: 'A-M' };

describe('efectivo', () => {
  it('lee montos con coma o punto', () => {
    expect(aCentavos('500')).toBe(50000);
    expect(aCentavos('12,5')).toBe(1250);
    expect(aCentavos('Bs 20.30')).toBe(2030);
    expect(aCentavos('')).toBeNull();
  });
  it('calcula el cambio solo si alcanza', () => {
    expect(cambio(50000, 43000)).toBe(7000);
    expect(cambio(40000, 43000)).toBeNull();
    expect(cambio(null, 43000)).toBeNull();
  });
});

describe('carrito de caja', () => {
  it('no deja pasar del disponible y resta de a uno', () => {
    let l = agregarLinea([], it1, 2);
    l = agregarLinea(l, it1, 2);
    l = agregarLinea(l, it1, 2);
    expect(l).toEqual([{ item: it1, cantidad: 2 }]);
    expect(totalCents(l)).toBe(86000);
    expect(restarLinea(restarLinea(l, 'v1'), 'v1')).toEqual([]);
  });
  it('busca por varias palabras (nombre, talla, color o SKU)', () => {
    expect(filtrarCatalogo([it1, it2], 'falda rosa').map((i) => i.varianteId)).toEqual(['v1']);
    expect(filtrarCatalogo([it1, it2], 'a-m').map((i) => i.varianteId)).toEqual(['v2']);
    expect(filtrarCatalogo([it1, it2], '')).toHaveLength(2);
  });
});
