import { useState } from "react"
import type { Producto } from "../../types/catalog.types"

// Sin `orden` expuesto por variante (el backend solo lo tiene en /catalogo/tallas, no
// en VarianteResponseDto) — se ordena por nombre conocido en vez de dejarlo en el
// orden arbitrario en que se crearon las variantes.
const ORDEN_TALLAS = ["XS", "S", "M", "L", "XL", "XXL"]

function uniqueOptions(items: { id: string; nombre: string }[]) {
  const seen = new Set<string>()
  return items.filter((item) => (seen.has(item.id) ? false : seen.add(item.id)))
}

/** Talla y color elegidos, y la variante que resulta de la combinación. */
export function useSeleccionVariante(producto: Producto) {
  const variantes = producto.variantes ?? []
  const tallas = uniqueOptions(variantes.map((v) => ({ id: v.tallaId, nombre: v.tallaNombre }))).sort(
    (a, b) => ORDEN_TALLAS.indexOf(a.nombre) - ORDEN_TALLAS.indexOf(b.nombre)
  )
  const colores = uniqueOptions(variantes.map((v) => ({ id: v.colorId, nombre: v.colorNombre })))

  const [tallaElegida, setTallaId] = useState<string | null>(null)
  const [colorElegido, setColorId] = useState<string | null>(null)
  // Si solo hay una opción, no hay elección real que hacer — se preselecciona
  // para no exigir un clic innecesario antes de poder comprar.
  const tallaId = tallaElegida ?? (tallas.length === 1 ? tallas[0].id : null)
  const colorId = colorElegido ?? (colores.length === 1 ? colores[0].id : null)

  const variante = variantes.find((v) => v.tallaId === tallaId && v.colorId === colorId) ?? null
  return { tallas, colores, tallaId, colorId, setTallaId, setColorId, variante }
}
