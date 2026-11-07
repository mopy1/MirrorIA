import { useState } from "react"
import { ShoppingBagOpen } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { Venta } from "@/features/checkout/types/checkout.types"
import { ElegirPagoDialog } from "@/features/payments/components/elegir-pago-dialog"
import { formatMoney } from "@/lib/money"
import { useComprarReserva } from "../hooks/useComprarReserva"

interface ComprarReservaProps {
  reservaId: string
  /** Compra de esta reserva que ya existe y espera el pago (no se crea otra). */
  ventaPendiente: Venta | null
  online: boolean
  onCambio: () => void
}

/** Acción primaria de una reserva EN_TIENDA: comprar lo apartado y pagarlo (efectivo en caja, tarjeta o QR). */
export function ComprarReserva({ reservaId, ventaPendiente, online, onCambio }: ComprarReservaProps) {
  const [abierto, setAbierto] = useState(false)
  const { comprar, isLoading, error, limpiarError } = useComprarReserva(onCambio)

  function abrir(v: boolean) {
    setAbierto(v)
    if (!v) limpiarError()
  }

  return (
    <div className="mt-4 flex flex-col gap-1.5">
      <Button className="w-full sm:w-auto sm:self-start" disabled={!online || isLoading} onClick={() => abrir(true)}>
        <ShoppingBagOpen className="size-4" />
        {ventaPendiente ? `Pagar mi compra (${formatMoney(ventaPendiente.totalCents)})` : "Comprar lo que reservé"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {online
          ? "Ya estás en la tienda: comprá lo que te probaste. Si pagás en efectivo, la cajera lo confirma en caja."
          : "Comprar lo reservado necesita conexión a internet."}
      </p>
      <ElegirPagoDialog
        open={abierto}
        onOpenChange={abrir}
        titulo={ventaPendiente ? "Pagar tu compra" : "Comprar lo que reservé"}
        descripcion="Se compran las prendas apartadas en esta reserva. Al pagarse, la reserva queda completada."
        textoConfirmar={isLoading ? "Preparando el pago..." : "Continuar al pago"}
        isLoading={isLoading}
        error={error}
        onConfirmar={(metodo) => comprar(reservaId, metodo, ventaPendiente?.id)}
      />
    </div>
  )
}
