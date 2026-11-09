import { describe, expect, it } from 'vitest';
import {
  ajusteSchema,
  aplanarVariantes,
  armarPayloadAjuste,
  etiquetaMovimiento,
  filasStock,
  libre,
  nivelStock,
  quedariaNegativo,
  resumenStock,
  sucursalesPermitidas,
} from './stock';
import {
  armarPayloadOrden,
  armarPayloadRecepcion,
  cantidadesIniciales,
  fechaEsperadaValida,
  proveedorDeVariante,
  resumenPorProveedor,
  variantesDelProveedor,
} from './ordenes';
import type { InventarioSucursal, OrdenCompra, Sucursal, VarianteConProducto } from '../types/inventario.types';

const fila = (varianteId: string, disp: number, res = 0, tr = 0): InventarioSucursal => ({
  id: `f-${varianteId}`, varianteId, sucursalId: 's1', cantidadDisponible: disp, cantidadReservada: res, cantidadEnTransito: tr,
});
const variante = (varianteId: string, productoTitulo: string, coleccionId = 'col-a'): VarianteConProducto => ({
  varianteId, productoId: `p-${varianteId}`, coleccionId, productoTitulo, tallaNombre: 'M', colorNombre: 'Rojo', sku: `SKU-${varianteId}`,
});

describe('niveles de stock (mismo umbral que la web)', () => {
  it('0 agotado, 1-5 bajo, 6+ ok', () => {
    expect(nivelStock(0)).toBe('agotado');
    expect(nivelStock(-1)).toBe('agotado');
    expect(nivelStock(5)).toBe('bajo');
    expect(nivelStock(6)).toBe('ok');
  });
  it('lo libre descuenta lo reservado sin bajar de 0', () => {
    expect(libre({ cantidadDisponible: 4, cantidadReservada: 1 })).toBe(3);
    expect(libre({ cantidadDisponible: 1, cantidadReservada: 3 })).toBe(0);
  });
});

describe('lista de stock', () => {
  const filas = [fila('a', 20), fila('b', 0), fila('c', 3, 1, 4)];
  const vars = [variante('a', 'Abrigo'), variante('b', 'Blusa'), variante('c', 'Camisa Lino')];
  it('lo urgente arriba y con su prenda', () => {
    const l = filasStock(filas, vars);
    expect(l.map((f) => f.varianteId)).toEqual(['b', 'c', 'a']);
    expect(l[0].variante?.productoTitulo).toBe('Blusa');
  });
  it('filtro de alertas y búsqueda sin tildes', () => {
    expect(filasStock(filas, vars, '', 'alertas').map((f) => f.varianteId)).toEqual(['b', 'c']);
    expect(filasStock(filas, vars, 'camisa').map((f) => f.varianteId)).toEqual(['c']);
    expect(filasStock(filas, vars, 'sku-a').map((f) => f.varianteId)).toEqual(['a']);
  });
  it('resumen con alertas', () => {
    expect(resumenStock(filas)).toEqual({ variantes: 3, unidades: 23, reservadas: 1, enTransito: 4, agotadas: 1, bajas: 1 });
  });
  it('aplana prendas en variantes con su foto principal', () => {
    const v = aplanarVariantes([
      {
        id: 'p1', categoriaId: 'c', coleccionId: 'col', titulo: 'Falda', slug: 'falda', descripcion: null, precioCents: 1, activo: true,
        imagenes: [{ url: 'b', orden: 1 }, { url: 'a', orden: 0 }],
        variantes: [{ id: 'v1', tallaId: 't', tallaNombre: 'S', colorId: 'k', colorNombre: 'Negro', sku: 'F-S', activo: true }],
      },
    ]);
    expect(v).toEqual([{ varianteId: 'v1', productoId: 'p1', coleccionId: 'col', productoTitulo: 'Falda', tallaNombre: 'S', colorNombre: 'Negro', sku: 'F-S', imagenUrl: 'a' }]);
  });
});

describe('quién ve qué sucursal', () => {
  const s = (id: string, activo = true) => ({ id, activo }) as Sucursal;
  it('la encargada solo la suya', () => {
    expect(sucursalesPermitidas([s('a'), s('b')], 'ENCARGADO_SUCURSAL', 'b').map((x) => x.id)).toEqual(['b']);
    expect(sucursalesPermitidas([s('a')], 'ENCARGADO_SUCURSAL', null)).toEqual([]);
  });
  it('la dueña todas las activas', () => {
    expect(sucursalesPermitidas([s('a'), s('b', false)], 'ADMIN').map((x) => x.id)).toEqual(['a']);
  });
});

describe('ajuste manual', () => {
  const base = { varianteId: 'v', sucursalId: 's', cantidad: '-2', motivo: ' Merma ' };
  it('valida entero distinto de 0 y motivo', () => {
    expect(ajusteSchema.safeParse(base).success).toBe(true);
    expect(ajusteSchema.safeParse({ ...base, cantidad: '0' }).success).toBe(false);
    expect(ajusteSchema.safeParse({ ...base, cantidad: '1.5' }).success).toBe(false);
    expect(ajusteSchema.safeParse({ ...base, motivo: '' }).success).toBe(false);
  });
  it('arma el cuerpo con número', () => {
    expect(armarPayloadAjuste({ ...base, cantidad: '+10' })).toEqual({ varianteId: 'v', sucursalId: 's', cantidad: 10, motivo: 'Merma' });
  });
  it('avisa si dejaría el stock en negativo', () => {
    expect(quedariaNegativo(1, '-2')).toBe(true);
    expect(quedariaNegativo(5, '-2')).toBe(false);
  });
  it('nombres de movimientos para la gerente', () => {
    expect(etiquetaMovimiento('RECEPCION_PROVEEDOR')).toBe('Llegó del proveedor');
    expect(etiquetaMovimiento('OTRO')).toBe('OTRO');
  });
});

describe('órdenes de compra', () => {
  const orden = (estado: OrdenCompra['estado'], proveedorId = 'prov'): OrdenCompra => ({
    id: 'o1', proveedorId, sucursalDestinoId: 's1', estado, fechaPedido: '2026-11-08', fechaEsperada: null, fechaRecepcion: null,
    items: [{ varianteId: 'a', cantidadPedida: 10, cantidadRecibida: 4 }, { varianteId: 'b', cantidadPedida: 5, cantidadRecibida: 0 }],
  });
  it('resumen por proveedor solo de las abiertas', () => {
    const m = resumenPorProveedor([orden('PENDIENTE'), orden('RECIBIDA_PARCIAL'), orden('CANCELADA'), orden('PENDIENTE', 'otro')]);
    expect(m.get('prov')).toEqual({ abiertas: 2, unidadesEnTransito: 22 });
    expect(m.get('otro')?.abiertas).toBe(1);
  });
  it('variantes del proveedor por su colección', () => {
    const vars = [variante('a', 'A', 'col-a'), variante('b', 'B', 'col-b')];
    const cols = [{ id: 'col-a', proveedorId: 'p1' }, { id: 'col-b', proveedorId: 'p2' }];
    expect(variantesDelProveedor(vars, cols, 'p2').map((v) => v.varianteId)).toEqual(['b']);
    expect(variantesDelProveedor(vars, cols, '')).toEqual([]);
    expect(proveedorDeVariante(vars, cols, 'a')).toBe('p1');
  });
  it('arma la orden solo con cantidades positivas', () => {
    expect(armarPayloadOrden('p', 's', { a: '3', b: '', c: '0' }, '').dto).toEqual({ proveedorId: 'p', sucursalDestinoId: 's', items: [{ varianteId: 'a', cantidadPedida: 3 }] });
    expect(armarPayloadOrden('p', 's', { a: '0' }, '').error).toMatch(/al menos una prenda/);
    expect(armarPayloadOrden('p', 's', { a: '1' }, '2020-01-01').error).toMatch(/fecha/);
  });
  it('fecha esperada', () => {
    const hoy = new Date('2026-11-08T12:00:00');
    expect(fechaEsperadaValida('', hoy)).toBe(true);
    expect(fechaEsperadaValida('2026-11-08', hoy)).toBe(true);
    expect(fechaEsperadaValida('2026-11-07', hoy)).toBe(false);
    expect(fechaEsperadaValida('20/11/2026', hoy)).toBe(false);
  });
  it('recepción: arranca con lo que falta y no deja pasarse', () => {
    const o = orden('RECIBIDA_PARCIAL');
    expect(cantidadesIniciales(o)).toEqual({ a: '6', b: '5' });
    expect(armarPayloadRecepcion(o, { a: '6', b: '0' }).dto).toEqual({ items: [{ varianteId: 'a', cantidadRecibida: 6 }] });
    expect(armarPayloadRecepcion(o, { a: '7' }).error).toMatch(/más de lo que falta/);
    expect(armarPayloadRecepcion(o, {}).error).toMatch(/al menos una unidad/);
  });
});
