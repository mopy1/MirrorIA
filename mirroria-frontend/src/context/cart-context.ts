import { createContext } from "react"
import type { Carrito } from "@/features/cart/types/cart.types"

export interface CartContextValue {
  carrito: Carrito | null
  itemCount: number
  isLoading: boolean
  refresh: () => Promise<void>
  addItem: (varianteId: string, cantidad: number) => Promise<void>
  removeItem: (varianteId: string) => Promise<void>
}

export const CartContext = createContext<CartContextValue | null>(null)
