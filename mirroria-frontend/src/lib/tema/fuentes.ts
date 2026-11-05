import type { FuenteMarca } from "@/types/marca.types"

// Cada paquete se separa en su propio chunk (import dinámico): una tienda solo
// descarga la fuente que eligió. Geist ya viene en el bundle principal.
const CARGADORES: Record<Exclude<FuenteMarca, "geist">, { cargar: () => Promise<unknown>; familia: string }> = {
  outfit: { cargar: () => import("@fontsource-variable/outfit"), familia: "Outfit Variable" },
  "dm-sans": { cargar: () => import("@fontsource-variable/dm-sans"), familia: "DM Sans Variable" },
  playfair: { cargar: () => import("@fontsource-variable/playfair-display"), familia: "Playfair Display Variable" },
}

const TOPE_MS = 300

/** Carga la fuente de títulos esperando como máximo 300 ms (después, `font-display: swap`). */
export async function cargarFuente(codigo: FuenteMarca): Promise<void> {
  if (codigo === "geist" || !(codigo in CARGADORES)) return
  const { cargar, familia } = CARGADORES[codigo]
  const tope = new Promise<void>((r) => setTimeout(r, TOPE_MS))
  const carga = cargar()
    .then(() => document.fonts?.load(`600 1em "${familia}"`))
    .then(() => undefined)
    .catch(() => undefined)
  await Promise.race([carga, tope])
}

/** Precarga sin esperar (vista previa del editor y de la landing). */
export function precargarFuente(codigo: FuenteMarca): void {
  void cargarFuente(codigo)
}
