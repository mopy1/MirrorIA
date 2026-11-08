/**
 * GET /catalogo/productos solo devuelve prendas activas: una prenda desactivada
 * desaparece del listado. Para poder reactivarla, el teléfono recuerda qué ids
 * desactivó la dueña (por tienda) y las trae una por una con GET /:id
 * (el ADMIN sí ve las inactivas). Acá va la parte pura de esa lista.
 */
export const claveInactivas = (tienda: string) => `mirroria_prendas_inactivas_${tienda}`;

export function leerIds(crudo: string | null): string[] {
  if (!crudo) return [];
  try {
    const v = JSON.parse(crudo);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function conId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id];
}

export function sinId(ids: string[], id: string): string[] {
  return ids.filter((x) => x !== id);
}
