import { Clock, Money, WarningCircle } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { cn } from "cn"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"
import { paymentsApi } from "../api/paymentsApi"
import type { Instrucciones } from "../types/payments.types"
import { DetallePagoCard } from "./detalle-pago-card"

/** Pantalla de instrucciones de pago en efectivo — la venta ya existe y
 * está `PENDIENTE`, un CAJERO/ADMIN confirma el cobro a mano más tarde.
 * Extraída de `PagoPage.tsx` (Regla 1.B: páginas solo orquestan). */
export function InstruccionesPago() {
  const { ventaId } = useParams<{ ventaId: string }>()
  const location = useLocation()
  // Por qué llegó acá, cuando no vino eligiendo: el checkout la manda para
  // este lado si el cobro con tarjeta no se pudo iniciar (503 sin claves de
  // Stripe). Su carrito ya está vacío, así que este es el único camino abierto.
  const motivo = (location.state as { motivo?: string } | null)?.motivo ?? null

  const [instrucciones, setInstrucciones] = useState<Instrucciones | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const solicitado = useRef<string | null>(null)

  useEffect(() => {
    if (!ventaId) return
    if (solicitado.current === ventaId) return
    solicitado.current = ventaId
    setIsLoading(true)
    setError(null)
    paymentsApi
      .iniciarManual(ventaId, "EFECTIVO")
      .then(setInstrucciones)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudieron generar las instrucciones de pago")
      )
      .finally(() => setIsLoading(false))
  }, [ventaId])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !instrucciones) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error ?? "No pudimos generar las instrucciones de pago."}
          </AlertDescription>
        </Alert>
        <Link to="/tienda" className={cn(buttonVariants({ variant: "outline" }), "mt-6 w-full")}>
          Volver a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6">
      <Money className="size-12 text-primary" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Pagá en efectivo</h1>
      <p className="mt-2 text-sm text-muted-foreground">{instrucciones.instrucciones}</p>

      {motivo && (
        <Alert className="mt-6 text-left">
          <WarningCircle />
          <AlertDescription>
            {motivo} Tu compra ya está reservada: podés pagarla en efectivo desde acá.
          </AlertDescription>
        </Alert>
      )}

      <DetallePagoCard instrucciones={instrucciones} />

      <Alert className="mt-6 text-left">
        <Clock />
        <AlertDescription>
          Tu compra queda <strong className="text-foreground">pendiente</strong> hasta que el
          equipo confirme el cobro a mano — ningún banco le avisa al sistema cuando pagás.
        </AlertDescription>
      </Alert>

      <Link to="/tienda" className={cn(buttonVariants({ variant: "outline" }), "mt-8")}>
        Volver a la tienda
      </Link>
    </div>
  )
}
