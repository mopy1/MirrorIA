import { useEffect } from "react"
import { checkoutApi } from "@/features/checkout/api/checkoutApi"
import { useResourceList } from "@/hooks/useResourceList"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { useTienda } from "@/hooks/useTienda"
import { useOutbox } from "@/lib/offline/use-outbox"
import { reservationsApi } from "../api/reservationsApi"

/**
 * Mis reservas + mis compras (para saber si una reserva ya tiene su compra
 * esperando el pago) + las reservas hechas sin red que siguen en la outbox.
 * Cuando una de la cola se confirma, se relee la lista del servidor.
 */
export function useMisReservas() {
  const user = useSesionEnTienda()
  const { slug } = useTienda()
  const reservas = useResourceList(reservationsApi.getMisReservas)
  const ventas = useResourceList(checkoutApi.getMisVentas)
  const { operaciones } = useOutbox({ tenantId: slug ?? undefined, usuarioId: user?.id })
  const deReserva = operaciones.filter((o) => o.tipo === "RESERVA_CREAR")
  const enCola = deReserva.filter((o) => o.estado !== "CONFIRMADA")
  const confirmadas = deReserva.length - enCola.length

  const { reload } = reservas
  useEffect(() => {
    if (confirmadas > 0) reload()
  }, [confirmadas, reload])

  return {
    ...reservas,
    ventas: ventas.items,
    enCola,
    reloadTodo: () => {
      reservas.reload()
      ventas.reload()
    },
  }
}
