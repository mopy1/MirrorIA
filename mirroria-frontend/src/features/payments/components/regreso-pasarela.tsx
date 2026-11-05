import { ArrowsClockwise, WarningCircle } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/money"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { useVentaDeRegreso } from "../hooks/useVentaDeRegreso"
import { EstadoRegreso } from "./estado-regreso"
import { VolverAlCarrito } from "./volver-al-carrito"

/** Pantalla de regreso de la pasarela de Stripe (éxito/cancelado) —
 * extraída de `PagoPage.tsx` (Regla 1.B: páginas solo orquestan). */
export function RegresoPasarela({ cancelado }: { cancelado: boolean }) {
  const ruta = useRutaTienda()
  const { ventaId, venta, error, isLoading, reintentar } = useVentaDeRegreso()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (!ventaId || error || !venta) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6">
        <WarningCircle className="size-14 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">No encontramos tu compra</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "Si ya pagaste, el equipo va a confirmar tu cobro igual apenas revise la pasarela."}
        </p>
        <Link to={ruta("/tienda")} className={cn(buttonVariants(), "mt-8")}>
          Volver a la tienda
        </Link>
      </div>
    )
  }

  const pendiente = venta.estado === "PENDIENTE"

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6">
      <EstadoRegreso venta={venta} cancelado={cancelado} />

      <Badge variant="secondary" className="mt-3">
        {venta.estado}
      </Badge>
      <p className="mt-4 text-lg font-medium text-foreground">{formatMoney(venta.totalCents)}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {pendiente && (
          <>
            <Link to={ruta(`/pago/${venta.id}?metodo=QR`)} className={cn(buttonVariants())}>
              Pagar con QR
            </Link>
            <Link to={ruta(`/pago/${venta.id}`)} className={cn(buttonVariants({ variant: "outline" }))}>
              Pagar en efectivo
            </Link>
            <Button variant="outline" onClick={reintentar} disabled={isLoading}>
              <ArrowsClockwise data-icon="inline-start" className="size-4" />
              <span>Volver a consultar</span>
            </Button>
          </>
        )}
        {pendiente && cancelado && <VolverAlCarrito ventaId={venta.id} />}
        <Link to={ruta("/tienda")} className={cn(buttonVariants(pendiente ? { variant: "outline" } : undefined))}>
          Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
