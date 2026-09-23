import { ArrowsClockwise, CheckCircle, Clock, WarningCircle, XCircle } from "@phosphor-icons/react"
import { useCallback, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { checkoutApi } from "@/features/checkout/api/checkoutApi"
import type { Venta } from "@/features/checkout/types/checkout.types"
import { ApiError } from "@/lib/api"
import { formatMoney } from "@/lib/money"

/**
 * La pasarela vuelve a /pago/exito y /pago/cancelado con el id de la venta
 * como parámetro (`?venta=...`), agregado por el backend a las URL de
 * éxito/cancelación. sessionStorage queda como respaldo para una
 * configuración vieja sin el parámetro, pero falla si la clienta vuelve en
 * otra pestaña, en otro dispositivo, o si borró datos de navegación —
 * useCheckout lo sigue guardando ahí antes de mandarla a pagar.
 */
const VENTA_ID_STORAGE_KEY = "mirroria_pago_venta_id"

/** Pantalla de regreso de la pasarela de Stripe (éxito/cancelado) —
 * extraída de `PagoPage.tsx` (Regla 1.B: páginas solo orquestan). */
export function RegresoPasarela({ cancelado }: { cancelado: boolean }) {
  const [searchParams] = useSearchParams()
  const [ventaId] = useState(
    () => searchParams.get("venta") ?? sessionStorage.getItem(VENTA_ID_STORAGE_KEY)
  )
  const [venta, setVenta] = useState<Venta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(ventaId !== null)

  const cargar = useCallback(() => {
    if (!ventaId) return
    checkoutApi
      .getVenta(ventaId)
      .then((v) => {
        setVenta(v)
        setError(null)
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo consultar tu compra")
      )
      .finally(() => setIsLoading(false))
  }, [ventaId])

  useEffect(() => {
    cargar()
  }, [cargar])

  function reintentar() {
    setIsLoading(true)
    cargar()
  }

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
          {error ??
            "Si ya pagaste, el equipo va a confirmar tu cobro igual apenas revise la pasarela."}
        </p>
        <Link to="/tienda" className={cn(buttonVariants(), "mt-8")}>
          Volver a la tienda
        </Link>
      </div>
    )
  }

  const pendiente = venta.estado === "PENDIENTE"
  const pagada = venta.estado === "PAGADA" || venta.estado === "ENTREGADA"

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6">
      {pagada ? (
        <>
          <CheckCircle weight="fill" className="size-14 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">¡Pago confirmado!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ya podés retirar tu pedido.</p>
        </>
      ) : pendiente && cancelado ? (
        <>
          <XCircle className="size-14 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Pago cancelado</h1>
          {/* Decía "podés volver a intentarlo desde el checkout" y era falso: el
              checkout ya vació el carrito al crear esta venta, así que no hay
              nada que volver a comprar. Lo que sí sigue abierto es pagar ESTA
              compra, que ya existe y tiene el stock reservado. */}
          <p className="mt-2 text-sm text-muted-foreground">
            No completaste el pago con tarjeta. Tu compra sigue pendiente y tu carrito ya se
            vació al crearla, así que el pago se retoma desde acá — no desde el checkout.
          </p>
        </>
      ) : pendiente ? (
        <>
          <Clock className="size-14 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Confirmando tu pago…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            La confirmación puede demorar unos segundos. Si ya pagaste, esperá un momento y
            volvé a consultar.
          </p>
        </>
      ) : (
        <>
          <WarningCircle className="size-14 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Tu compra ya no está activa</h1>
          <p className="mt-2 text-sm text-muted-foreground">Estado actual: {venta.estado.toLowerCase()}.</p>
        </>
      )}

      <Badge variant="secondary" className="mt-3">
        {venta.estado}
      </Badge>
      <p className="mt-4 text-lg font-medium text-foreground">{formatMoney(venta.totalCents)}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {pendiente && (
          <Link to={`/pago/${venta.id}`} className={cn(buttonVariants())}>
            Pagar en efectivo
          </Link>
        )}
        {pendiente && (
          <Button variant="outline" onClick={reintentar} disabled={isLoading}>
            <ArrowsClockwise data-icon="inline-start" className="size-4" />
            <span>Volver a consultar</span>
          </Button>
        )}
        <Link to="/tienda" className={cn(buttonVariants(pendiente ? { variant: "outline" } : undefined))}>
          Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
