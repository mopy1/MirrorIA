import { z } from 'zod';
import type { CreateProductoDto, Producto } from '../types/catalogo-admin.types';
import { normalizar } from './texto';

const URL_IMAGEN = /^https?:\/\/[^\s]+$/i;

/** "180", "180.5" o "180,50" → 18050 centavos; null si no es un precio válido. */
export function precioACentavos(texto: string): number | null {
  const limpio = texto.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
  const cents = Math.round(Number(limpio) * 100);
  return Number.isFinite(cents) ? cents : null;
}

export function centavosATexto(cents: number): string {
  if (!cents) return '';
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export const productoSchema = z.object({
  titulo: z.string().trim().min(2, 'Escribí el nombre de la prenda (mínimo 2 letras)'),
  slug: z
    .string()
    .trim()
    .min(2, 'El identificador web necesita al menos 2 caracteres')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones (ej. vestido-gala-seda)'),
  categoriaId: z.string().min(1, 'Elegí una categoría'),
  coleccionId: z.string().min(1, 'Elegí una colección'),
  descripcion: z.string(),
  precio: z
    .string()
    .min(1, 'Poné el precio de venta')
    .refine((v) => (precioACentavos(v) ?? 0) > 0, 'Precio inválido: usá un número mayor a 0 (ej. 180 o 180,50)'),
  imagenes: z.array(
    z.object({
      url: z
        .string()
        .trim()
        .refine((v) => v === '' || URL_IMAGEN.test(v), 'La foto tiene que ser un enlace que empiece con https://'),
    })
  ),
});

export type ProductoFormValues = z.infer<typeof productoSchema>;

export const PRODUCTO_VACIO: ProductoFormValues = {
  titulo: '',
  slug: '',
  categoriaId: '',
  coleccionId: '',
  descripcion: '',
  precio: '',
  imagenes: [{ url: '' }],
};

/** Valores del formulario al editar una prenda existente. */
export function valoresDesdeProducto(p: Producto): ProductoFormValues {
  const imagenes = [...(p.imagenes ?? [])]
    .sort((a, b) => a.orden - b.orden)
    .filter((i) => !i.varianteId)
    .map((i) => ({ url: i.url }));
  return {
    titulo: p.titulo ?? '',
    slug: p.slug ?? '',
    categoriaId: p.categoriaId ?? '',
    coleccionId: p.coleccionId ?? '',
    descripcion: p.descripcion ?? '',
    precio: centavosATexto(p.precioCents),
    imagenes: imagenes.length > 0 ? imagenes : [{ url: '' }],
  };
}

/**
 * Cuerpo del POST/PATCH /catalogo/productos (mismo armado que la web): precio en
 * centavos, descripción vacía fuera, fotos sin las filas vacías y con su orden.
 * Al editar se conservan las fotos propias de cada variante.
 */
export function armarPayloadProducto(v: ProductoFormValues, original?: Producto): CreateProductoDto {
  const generales = v.imagenes
    .map((i) => i.url.trim())
    .filter(Boolean)
    .map((url, orden) => ({ url, orden }));
  const deVariantes = (original?.imagenes ?? [])
    .filter((i) => i.varianteId)
    .map((i, k) => ({ ...i, orden: generales.length + k }));
  return {
    categoriaId: v.categoriaId,
    coleccionId: v.coleccionId,
    titulo: v.titulo.trim(),
    slug: v.slug.trim(),
    descripcion: v.descripcion.trim() || undefined,
    precioCents: precioACentavos(v.precio) ?? 0,
    imagenes: [...generales, ...deVariantes],
  };
}

/** Búsqueda por nombre o slug + filtro de categoría, igual que la tabla de la web. */
export function filtrarProductos<T extends Pick<Producto, 'titulo' | 'slug' | 'categoriaId'>>(
  productos: T[],
  busqueda: string,
  categoriaId: string
): T[] {
  const q = normalizar(busqueda);
  return productos.filter(
    (p) =>
      (categoriaId === 'TODAS' || p.categoriaId === categoriaId) &&
      (!q || normalizar(p.titulo).includes(q) || p.slug.toLowerCase().includes(q))
  );
}
