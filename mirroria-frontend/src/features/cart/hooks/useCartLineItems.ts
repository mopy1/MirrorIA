import { useVariantesConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import { useCart } from "@/hooks/useCart"

export interface CartLineItem {
  varianteId: string
  cantidad: number
  productoId: string
  productoTitulo: string
  tallaNombre: string
  colorNombre: string
  precioUnitCents: number
  subtotalCents: number
  imagenUrl?: string
}

/**
 * `carritos.items` (backend) solo trae {varianteId, cantidad} — el cruce con
 * nombre/talla/color/precio lo resuelve `useVariantesConProducto` (aplana el
 * catálogo una vez); acá solo se cruza contra los ítems del carrito.
 */
export function useCartLineItems() {
  const { carrito, isLoading: cartLoading, removeItem } = useCart()
  const { variantes, isLoading: catalogoLoading, error } = useVariantesConProducto()

  const lineItems: CartLineItem[] = (carrito?.items ?? []).flatMap((item) => {
    const variante = variantes.find((v) => v.varianteId === item.varianteId)
    if (!variante) return []
    return [
      {
        varianteId: item.varianteId,
        cantidad: item.cantidad,
        productoId: variante.productoId,
        productoTitulo: variante.productoTitulo,
        tallaNombre: variante.tallaNombre,
        colorNombre: variante.colorNombre,
        precioUnitCents: variante.precioCents,
        subtotalCents: variante.precioCents * item.cantidad,
        imagenUrl: variante.imagenUrl,
      },
    ]
  })

  return { lineItems, isLoading: cartLoading || catalogoLoading, error, removeItem }
}
