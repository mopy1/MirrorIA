import { z } from 'zod';
import type { CreateVarianteDto, Variante } from '../types/catalogo-admin.types';
import { slugDesdeTitulo } from './texto';

export const varianteSchema = z.object({
  tallaId: z.string().min(1, 'Elegí la talla'),
  colorId: z.string().min(1, 'Elegí el color'),
  sku: z.string().trim().min(2, 'El código (SKU) necesita al menos 2 caracteres'),
});

export type VarianteFormValues = z.infer<typeof varianteSchema>;

export const VARIANTE_VACIA: VarianteFormValues = { tallaId: '', colorId: '', sku: '' };

/** SKU sugerido: "vestido-gala" + M + Rojo → "VESTIDO-GALA-M-ROJO". La dueña lo puede cambiar. */
export function skuSugerido(slugProducto: string, talla?: string, color?: string): string {
  return [slugProducto, talla, color]
    .filter(Boolean)
    .map((p) => slugDesdeTitulo(String(p)))
    .filter(Boolean)
    .join('-')
    .toUpperCase();
}

/** ¿La prenda ya tiene esa combinación de talla y color? (el backend no lo frena: lo evitamos acá). */
export function combinacionRepetida(variantes: Variante[], tallaId: string, colorId: string): boolean {
  return variantes.some((v) => v.tallaId === tallaId && v.colorId === colorId);
}

export function armarPayloadVariante(v: VarianteFormValues): CreateVarianteDto {
  return { tallaId: v.tallaId, colorId: v.colorId, sku: v.sku.trim() };
}
