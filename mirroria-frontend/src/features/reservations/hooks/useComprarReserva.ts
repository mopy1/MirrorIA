import { useState } from "react"
import { useIrAPagar } from "@/features/payments/hooks/useIrAPagar"
import type { MetodoPago } from "@/features/payments/types/payments.types"
import { ApiError } from "@/lib/api"
import { hayRed } from "@/lib/offline/red-simulada"
import { reservationsApi } from "../api/reservationsApi"
import { mensajeErrorCompraReserva } from "../lib/comprarReserva"

/**
 * "Comprar lo que reservé" (POST /ventas/desde-reserva/:id): crea la venta
 * PENDIENTE y la lleva al mismo pago que el checkout. Solo con red: no se
 * encola (Movil_Spec D4). Si ya había una compra sin pagar, va directo a pagarla.
 */
export function useComprarReserva(onError?: () => void) {
  const irAPagar = useIrAPagar()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function comprar(reservaId: string, metodo: MetodoPago, ventaPendienteId?: string) {
    setIsLoading(true)
    setError(null)
    try {
      if (!hayRed()) throw new ApiError(0, "sin red")
      const ventaId = ventaPendienteId ?? (await reservationsApi.comprar(reservaId)).id
      await irAPagar(ventaId, metodo)
    } catch (err) {
      setError(mensajeErrorCompraReserva(err))
      onError?.()
    } finally {
      setIsLoading(false)
    }
  }

  return { comprar, isLoading, error, limpiarError: () => setError(null) }
}
