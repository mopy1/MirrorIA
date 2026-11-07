import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { cartApi } from "@/features/cart/api/cartApi"
import type { Carrito } from "@/features/cart/types/cart.types"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { useTienda } from "@/hooks/useTienda"
import { encolarAgregarCarrito } from "@/lib/offline/operaciones-clienta"
import { CartContext, type CartContextValue } from "./cart-context"
import { mezclarCarrito, useCarritoEnCola } from "./use-carrito-en-cola"

const SIN_RED = "Sin conexión: cambiar o quitar prendas necesita internet"

/**
 * El carrito vive del lado del backend por usuarioId (ver
 * mirroria-backend/modules/ventas) — solo tiene sentido para un usuario
 * autenticado. Este contexto existe (en vez de vivir solo en CartPage)
 * porque el ícono del navbar necesita reaccionar en vivo cuando se agrega un
 * producto desde la ficha de detalle, igual motivo que AuthContext.
 *
 * Sin red, "agregar" va a la outbox (CARRITO_AGREGAR) y el ítem se ve con
 * "Pendiente de confirmar" encima del carrito del servidor; cambiar o quitar
 * necesita red. Si la lectura falla (sin red) se conserva el último carrito.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const user = useSesionEnTienda()
  const { slug } = useTienda()
  const [carrito, setCarrito] = useState<Carrito | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const cola = useCarritoEnCola(slug, user?.id ?? null)

  const refresh = useCallback(async () => {
    if (!user) {
      setCarrito(null)
      return
    }
    try {
      setCarrito(await cartApi.getCarrito(user.id))
    } catch {
      // Sin red: se queda el último carrito conocido.
    }
  }, [user])

  // También cuando una operación sale de la cola (se confirmó o se anuló).
  useEffect(() => {
    void refresh()
  }, [refresh, cola.firmaCola])

  const conRed = useCallback(
    async (fn: () => Promise<Carrito>) => {
      if (!cola.online) throw new Error(SIN_RED)
      setIsLoading(true)
      try {
        setCarrito(await fn())
      } finally {
        setIsLoading(false)
      }
    },
    [cola.online]
  )

  const value = useMemo<CartContextValue>(() => {
    const visible = user ? mezclarCarrito(carrito, cola.operaciones, user.id) : null
    return {
      carrito: visible,
      itemCount: visible?.items.reduce((sum, item) => sum + item.cantidad, 0) ?? 0,
      isLoading,
      refresh,
      variantesPendientes: cola.variantesPendientes,
      checkoutEnCola: cola.checkoutEnCola,
      addItem: async (varianteId, cantidad, descripcion) => {
        if (!user) throw new Error("Necesitás iniciar sesión para agregar al carrito")
        if (!cola.online && slug) {
          await encolarAgregarCarrito({ tenantId: slug, usuarioId: user.id, varianteId, cantidad, descripcion: descripcion ?? "Prenda al carrito" })
          return "ENCOLADA"
        }
        await conRed(() => cartApi.addItem(user.id, varianteId, cantidad))
        return "AGREGADA"
      },
      updateItem: async (varianteId, cantidad) => {
        if (user) await conRed(() => cartApi.updateItem(user.id, varianteId, cantidad))
      },
      removeItem: async (varianteId) => {
        if (user) await conRed(() => cartApi.removeItem(user.id, varianteId))
      },
    }
  }, [carrito, cola, conRed, isLoading, refresh, slug, user])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
