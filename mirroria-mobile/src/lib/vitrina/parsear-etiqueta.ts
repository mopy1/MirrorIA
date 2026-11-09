/**
 * Etiqueta de una prenda (D10): QR o Code128 con el SKU de la variante (`variantes_producto.sku`,
 * único por tienda, p. ej. `VFL-M-ROJ`). Formatos aceptados:
 *  - el SKU en texto plano: `VFL-M-ROJ`
 *  - con prefijo: `mirroria:v:VFL-M-ROJ`
 *  - un enlace con `?sku=` o `?codigo=` (etiquetas que también abren la web)
 * Devuelve el SKU normalizado (mayúsculas, sin espacios) o `null` si no parece una etiqueta.
 */
const PREFIJO = /^mirroria:v:/i;
const SKU_VALIDO = /^[A-Z0-9][A-Z0-9._-]{1,59}$/;

export function parsearEtiqueta(leido: string | null | undefined): string | null {
  let texto = (leido ?? '').trim();
  if (!texto) return null;
  if (/^https?:\/\//i.test(texto)) {
    const consulta = texto.split('?')[1]?.split('#')[0] ?? '';
    const par = consulta.split('&').map((p) => p.split('=')).find(([k]) => k === 'sku' || k === 'codigo');
    if (!par?.[1]) return null;
    texto = safeDecode(par[1]);
  }
  const sku = texto.replace(PREFIJO, '').trim().toUpperCase();
  return SKU_VALIDO.test(sku) ? sku : null;
}

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v.replace(/\+/g, ' '));
  } catch {
    return v;
  }
}
