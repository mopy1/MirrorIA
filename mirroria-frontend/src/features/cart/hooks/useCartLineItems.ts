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
  /** false: la prenda se dio de baja; el backend rechaza el checkout hasta quitarla. */
  disponible: boolean
  /** Agregada sin red: está en la outbox, "Pendiente de confirmar" (RN09). */
  pendiente: boolean
}

/**
 * `carritos.items` (backend) solo trae {varianteId, cantidad} — el cruce con
 * nombre/talla/color/precio lo resuelve `useVariantesConProducto` (aplana el
 * catálogo una vez); acá solo se cruza contra los ítems del carrito.
 */
export function useCartLineItems() {
  const { carrito, isLoading: cartLoading, removeItem, updateItem, variantesPendientes } = useCart()
  const { variantes, isLoading: catalogoLoading, error } = useVariantesConProducto()

  const lineItems: CartLineItem[] = (carrito?.items ?? []).flatMap((item): CartLineItem[] => {
    const variante = variantes.find((v) => v.varianteId === item.varianteId)
    // Antes un ítem que ya no está en el catálogo se ocultaba en silencio: no
    // se podía quitar y el checkout fallaba. Ahora se muestra para quitarlo
    // (salvo si el catálogo no cargó: ahí no se sabe nada).
    if (!variante || !variante.activo) {
      if (catalogoLoading || error) return []
      return [
        {
          varianteId: item.varianteId,
          cantidad: item.cantidad,
          productoId: variante?.productoId ?? "",
          productoTitulo: variante?.productoTitulo ?? "Prenda",
          tallaNombre: variante?.tallaNombre ?? "—",
          colorNombre: variante?.colorNombre ?? "—",
          precioUnitCents: 0,
          subtotalCents: 0,
          imagenUrl: variante?.imagenUrl,
          disponible: false,
          pendiente: variantesPendientes.includes(item.varianteId),
        },
      ]
    }
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
        disponible: true,
        pendiente: variantesPendientes.includes(item.varianteId),
      },
    ]
  })

  return { lineItems, variantes, isLoading: cartLoading || catalogoLoading, error, removeItem, updateItem }
}
