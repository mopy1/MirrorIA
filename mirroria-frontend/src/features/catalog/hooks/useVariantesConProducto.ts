import { useEffect, useState } from "react"
import { catalogApi } from "../api/catalogApi"

export interface VarianteConProducto {
  varianteId: string
  productoId: string
  productoTitulo: string
  tallaNombre: string
  colorNombre: string
  sku: string
  precioCents: number
  imagenUrl?: string
}

/**
 * Aplana el catálogo a nivel de variante (producto + talla + color + sku).
 * El backend no expone un endpoint así directamente — solo el listado de
 * productos (sin variantes) y el detalle por producto (con variantes) — así
 * que se hace el cruce acá con un fetch por producto. Promovido desde
 * `useCartLineItems` (que hacía este mismo fetch para resolver los ítems del
 * carrito) porque ahora también lo necesita el formulario de ajuste manual
 * de inventario en el panel admin — 2+ consumidores, mismo criterio de
 * promoción que el resto de hooks compartidos.
 */
export function useVariantesConProducto() {
  const [variantes, setVariantes] = useState<VarianteConProducto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      setIsLoading(true)
      setError(null)
      try {
        const productos = await catalogApi.getProductos()
        const detalles = await Promise.all(productos.map((p) => catalogApi.getProducto(p.id)))
        const planas = detalles.flatMap((producto) =>
          (producto.variantes ?? []).map((variante) => ({
            varianteId: variante.id,
            productoId: producto.id,
            productoTitulo: producto.titulo,
            tallaNombre: variante.tallaNombre,
            colorNombre: variante.colorNombre,
            sku: variante.sku,
            precioCents: producto.precioCents,
            imagenUrl: producto.imagenes?.[0]?.url,
          }))
        )
        if (!cancelado) setVariantes(planas)
      } catch {
        if (!cancelado) setError("No se pudo cargar el catálogo")
      } finally {
        if (!cancelado) setIsLoading(false)
      }
    }
    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  return { variantes, isLoading, error }
}
