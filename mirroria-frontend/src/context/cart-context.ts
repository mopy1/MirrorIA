import { createContext } from "react"
import type { Carrito } from "@/features/cart/types/cart.types"

export interface CartContextValue {
  /** Carrito del servidor + lo agregado sin red que espera en la outbox. */
  carrito: Carrito | null
  itemCount: number
  isLoading: boolean
  refresh: () => Promise<void>
  /** varianteIds agregados sin red, todavía "Pendiente de confirmar". */
  variantesPendientes: string[]
  /** Hay un checkout en la outbox esperando la red (no se puede confirmar otro). */
  checkoutEnCola: boolean
  /** "ENCOLADA" si no había red y fue a la outbox. */
  addItem: (varianteId: string, cantidad: number, descripcion?: string) => Promise<"AGREGADA" | "ENCOLADA">
  updateItem: (varianteId: string, cantidad: number) => Promise<void>
  removeItem: (varianteId: string) => Promise<void>
}

export const CartContext = createContext<CartContextValue | null>(null)
