import { CheckCircle, Clock, WarningCircle, XCircle } from "@phosphor-icons/react"
import type { Venta } from "@/features/checkout/types/checkout.types"

/** Icono, título y texto según cómo volvió la clienta de la pasarela. */
export function EstadoRegreso({ venta, cancelado }: { venta: Venta; cancelado: boolean }) {
  const pendiente = venta.estado === "PENDIENTE"
  const pagada = venta.estado === "PAGADA" || venta.estado === "ENTREGADA"

  if (pagada) {
    return (
      <>
        <CheckCircle weight="fill" className="size-14 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">¡Pago confirmado!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ya podés retirar tu pedido.</p>
      </>
    )
  }
  if (pendiente && cancelado) {
    return (
      <>
        <XCircle className="size-14 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Pago cancelado</h1>
        {/* El checkout vacía el carrito al crear la venta: la compra sigue
            reservada y se puede pagar por otro medio, o cancelarla y
            recuperar las prendas en el carrito (VolverAlCarrito). */}
        <p className="mt-2 text-sm text-muted-foreground">
          No completaste el pago en línea. Tu compra sigue reservada: podés pagarla con otro
          medio o cancelarla y volver a tu carrito con las mismas prendas.
        </p>
      </>
    )
  }
  if (pendiente) {
    return (
      <>
        <Clock className="size-14 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Confirmando tu pago…</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La confirmación puede demorar unos segundos. Si ya pagaste, esperá un momento y
          volvé a consultar.
        </p>
      </>
    )
  }
  return (
    <>
      <WarningCircle className="size-14 text-muted-foreground" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Tu compra ya no está activa</h1>
      <p className="mt-2 text-sm text-muted-foreground">Estado actual: {venta.estado.toLowerCase()}.</p>
    </>
  )
}
