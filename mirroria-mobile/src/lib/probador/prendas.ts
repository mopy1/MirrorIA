/** Prenda de la vitrina que se puede probar (sale de SQLite, `catalogo_local`). */
export interface PrendaProbable {
  id: string;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  /** Foto de referencia que se le manda a Decart (la primera por `orden`). */
  imagen: string | null;
}

/**
 * Mismo prompt que la web (`mirroria-frontend/src/features/fitting/lib/promptDePrenda.ts`):
 * en inglés, con el patrón "Substitute the current X with..." de la guía de VTON 3.5.
 */
export function promptDePrenda(p: Pick<PrendaProbable, 'nombre' | 'categoria' | 'descripcion'>): string {
  const objeto = p.categoria ? p.categoria.toLowerCase() : 'outfit';
  const detalle = p.descripcion?.trim();
  return `Substitute the current ${objeto} with: ${p.nombre}.${detalle ? ` ${detalle}` : ''}`;
}

/** Solo se prueban las prendas con foto real: es la referencia que necesita la IA. */
export function prendasProbables<T extends Pick<PrendaProbable, 'imagen'>>(lista: T[]): T[] {
  return lista.filter((p) => !!p.imagen);
}

/** La prenda pedida por la ficha ("Probármelo"); si no está o no tiene foto, la primera de la tira. */
export function elegirPrenda<T extends PrendaProbable>(lista: T[], id?: string | null): T | null {
  const probables = prendasProbables(lista);
  return (id ? probables.find((p) => p.id === id) : undefined) ?? probables[0] ?? null;
}
