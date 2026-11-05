import type { MarcaPublica } from "@/types/marca.types"

/** Lo emite /admin/apariencia al guardar: el AdminLayout re-aplica el tema y el logo sin recargar. */
export const EVENTO_MARCA_ACTUALIZADA = "tiendaria:marca-actualizada"

export function avisarMarcaActualizada(marca: MarcaPublica, nombre: string): void {
  window.dispatchEvent(new CustomEvent(EVENTO_MARCA_ACTUALIZADA, { detail: { marca, nombre } }))
}
