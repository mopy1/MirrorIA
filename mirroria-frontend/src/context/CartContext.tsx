import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { cartApi } from "@/features/cart/api/cartApi"
import type { Carrito } from "@/features/cart/types/cart.types"
import { useAuth } from "@/hooks/useAuth"
import { CartContext, type CartContextValue } from "./cart-context"

/**
 * El carrito vive del lado del backend por usuarioId (ver
 * mirroria-backend/modules/ventas) — solo tiene sentido para un usuario
 * autenticado. Este contexto existe (en vez de vivir solo en CartPage)
 * porque el ícono del navbar necesita reaccionar en vivo cuando se agrega un
 * producto desde la ficha de detalle, igual motivo que AuthContext.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [carrito, setCarrito] = useState<Carrito | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setCarrito(null)
      return
    }
    const data = await cartApi.getCarrito(user.id)
    setCarrito(data)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo<CartContextValue>(
    () => ({
      carrito,
      itemCount: carrito?.items.reduce((sum, item) => sum + item.cantidad, 0) ?? 0,
      isLoading,
      refresh,
      addItem: async (varianteId, cantidad) => {
        if (!user) throw new Error("Necesitás iniciar sesión para agregar al carrito")
        setIsLoading(true)
        try {
          setCarrito(await cartApi.addItem(user.id, varianteId, cantidad))
        } finally {
          setIsLoading(false)
        }
      },
      removeItem: async (varianteId) => {
        if (!user) return
        setIsLoading(true)
        try {
          setCarrito(await cartApi.removeItem(user.id, varianteId))
        } finally {
          setIsLoading(false)
        }
      },
    }),
    [carrito, isLoading, refresh, user]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
