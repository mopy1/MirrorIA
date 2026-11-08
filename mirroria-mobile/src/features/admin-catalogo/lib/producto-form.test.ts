import { describe, expect, it } from 'vitest';
import {
  armarPayloadProducto,
  centavosATexto,
  filtrarProductos,
  precioACentavos,
  PRODUCTO_VACIO,
  productoSchema,
  valoresDesdeProducto,
  type ProductoFormValues,
} from './producto-form';
import { conId, leerIds, sinId } from './prendas-inactivas';
import { esErrorDeLimite, iniciales, slugDesdeTitulo } from './texto';
import { resumenPlan } from './uso-plan';
import { armarPayloadVariante, combinacionRepetida, skuSugerido, varianteSchema } from './variante-form';
import type { Producto, Variante } from '../types/catalogo-admin.types';

const valido: ProductoFormValues = {
  titulo: '  Vestido Gala Seda ',
  slug: 'vestido-gala-seda',
  categoriaId: 'cat-1',
  coleccionId: 'col-1',
  descripcion: '   ',
  precio: '180,50',
  imagenes: [{ url: 'https://x.test/a.jpg' }, { url: '' }, { url: ' https://x.test/b.jpg ' }],
};

const producto: Producto = {
  id: 'p1',
  categoriaId: 'cat-1',
  coleccionId: 'col-1',
  titulo: 'Falda Serranía',
  slug: 'falda-serrania',
  descripcion: null,
  precioCents: 43000,
  imagenes: [
    { url: 'https://x.test/2.jpg', orden: 1 },
    { url: 'https://x.test/var.jpg', orden: 0, varianteId: 'v1' },
    { url: 'https://x.test/1.jpg', orden: 0 },
  ],
  activo: true,
};

describe('precio', () => {
  it('acepta punto o coma y pasa a centavos', () => {
    expect(precioACentavos('180')).toBe(18000);
    expect(precioACentavos('180,5')).toBe(18050);
    expect(precioACentavos('0.99')).toBe(99);
  });
  it('rechaza textos y más de dos decimales', () => {
    expect(precioACentavos('abc')).toBeNull();
    expect(precioACentavos('1.999')).toBeNull();
    expect(precioACentavos('-5')).toBeNull();
  });
  it('vuelve a texto para editar', () => {
    expect(centavosATexto(43000)).toBe('430');
    expect(centavosATexto(18050)).toBe('180.50');
  });
});

describe('validación de prenda', () => {
  it('un formulario completo pasa', () => {
    expect(productoSchema.safeParse(valido).success).toBe(true);
  });
  it('el formulario vacío marca nombre, slug, categoría, colección y precio', () => {
    const r = productoSchema.safeParse(PRODUCTO_VACIO);
    expect(r.success).toBe(false);
    const campos = r.error!.issues.map((i) => i.path[0]);
    expect(campos).toEqual(expect.arrayContaining(['titulo', 'slug', 'categoriaId', 'coleccionId', 'precio']));
  });
  it('precio 0 y slug con mayúsculas no pasan', () => {
    const r = productoSchema.safeParse({ ...valido, precio: '0', slug: 'Vestido Gala' });
    expect(r.error!.issues.map((i) => i.path[0])).toEqual(expect.arrayContaining(['precio', 'slug']));
  });
  it('una foto que no es enlace no pasa; la fila vacía sí', () => {
    const r = productoSchema.safeParse({ ...valido, imagenes: [{ url: 'foto.jpg' }, { url: '' }] });
    expect(r.error!.issues[0].path).toEqual(['imagenes', 0, 'url']);
  });
});

describe('armado del cuerpo para el backend', () => {
  it('alta: centavos, sin descripción vacía y fotos sin filas vacías con su orden', () => {
    expect(armarPayloadProducto(valido)).toEqual({
      categoriaId: 'cat-1',
      coleccionId: 'col-1',
      titulo: 'Vestido Gala Seda',
      slug: 'vestido-gala-seda',
      descripcion: undefined,
      precioCents: 18050,
      imagenes: [
        { url: 'https://x.test/a.jpg', orden: 0 },
        { url: 'https://x.test/b.jpg', orden: 1 },
      ],
    });
  });
  it('edición: conserva las fotos de variante al final', () => {
    const v = valoresDesdeProducto(producto);
    expect(v.imagenes).toEqual([{ url: 'https://x.test/1.jpg' }, { url: 'https://x.test/2.jpg' }]);
    expect(v.precio).toBe('430');
    const dto = armarPayloadProducto(v, producto);
    expect(dto.imagenes).toEqual([
      { url: 'https://x.test/1.jpg', orden: 0 },
      { url: 'https://x.test/2.jpg', orden: 1 },
      { url: 'https://x.test/var.jpg', orden: 2, varianteId: 'v1' },
    ]);
  });
  it('una prenda sin fotos arranca con una fila vacía para cargar', () => {
    expect(valoresDesdeProducto({ ...producto, imagenes: [] }).imagenes).toEqual([{ url: '' }]);
  });
});

describe('búsqueda y filtros', () => {
  const lista = [producto, { ...producto, id: 'p2', titulo: 'Camisa Lino', slug: 'camisa-lino', categoriaId: 'cat-2' }];
  it('busca sin tildes por nombre o slug', () => {
    expect(filtrarProductos(lista, 'serrania', 'TODAS').map((p) => p.id)).toEqual(['p1']);
    expect(filtrarProductos(lista, 'CAMISA-L', 'TODAS').map((p) => p.id)).toEqual(['p2']);
  });
  it('filtra por categoría', () => {
    expect(filtrarProductos(lista, '', 'cat-2').map((p) => p.id)).toEqual(['p2']);
  });
});

describe('variantes', () => {
  const variantes: Variante[] = [{ id: 'v1', tallaId: 't-m', tallaNombre: 'M', colorId: 'c-r', colorNombre: 'Rojo', sku: 'X', activo: true }];
  it('sugiere un SKU legible', () => {
    expect(skuSugerido('vestido-gala', 'M', 'Azul marino')).toBe('VESTIDO-GALA-M-AZUL-MARINO');
  });
  it('detecta la combinación repetida', () => {
    expect(combinacionRepetida(variantes, 't-m', 'c-r')).toBe(true);
    expect(combinacionRepetida(variantes, 't-m', 'c-a')).toBe(false);
  });
  it('valida y arma el cuerpo', () => {
    expect(varianteSchema.safeParse({ tallaId: '', colorId: 'c', sku: 'a' }).success).toBe(false);
    expect(armarPayloadVariante({ tallaId: 't', colorId: 'c', sku: ' ab-1 ' })).toEqual({ tallaId: 't', colorId: 'c', sku: 'ab-1' });
  });
});

describe('textos y plan', () => {
  it('slug desde el título', () => {
    expect(slugDesdeTitulo('Poncho Andino ñandú 100%')).toBe('poncho-andino-nandu-100');
  });
  it('reconoce el 409 del plan por su mensaje', () => {
    expect(esErrorDeLimite('Tu plan Básico permite hasta 10 productos activos. Mejorá tu plan para agregar más.')).toBe(true);
    expect(esErrorDeLimite('Ya existe una variante con el SKU "X"')).toBe(false);
  });
  it('iniciales', () => {
    expect(iniciales('Textiles del Sur')).toBe('TS');
    expect(iniciales('Aguayo')).toBe('AG');
  });
  it('resumen del cupo', () => {
    expect(resumenPlan({ planNombre: 'Cadena', maxProductos: null, productosActivos: 6 }, 6).texto).toContain('sin límite');
    expect(resumenPlan({ planNombre: 'Básico', maxProductos: 10, productosActivos: 10 }, 10).lleno).toBe(true);
    expect(resumenPlan({ planNombre: 'Básico', maxProductos: 10, productosActivos: 9 }, 9).casiLleno).toBe(true);
    expect(resumenPlan(null, 3).texto).toBe('3 prendas activas');
  });
  it('lista de prendas desactivadas que recuerda el teléfono', () => {
    expect(leerIds('no-json')).toEqual([]);
    expect(conId(['a'], 'a')).toEqual(['a']);
    expect(sinId(conId(['a'], 'b'), 'a')).toEqual(['b']);
  });
});
