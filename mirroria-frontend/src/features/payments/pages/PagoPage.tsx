import {
  ArrowsClockwise,
  CheckCircle,
  Clock,
  Money,
  QrCode,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom"
import { cn } from "cn"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { checkoutApi } from "@/features/checkout/api/checkoutApi"
import type { Venta } from "@/features/checkout/types/checkout.types"
import { ApiError } from "@/lib/api"
import { formatMoney } from "@/lib/money"
import { paymentsApi } from "../api/paymentsApi"
import type { Instrucciones, MetodoPago } from "../types/payments.types"

/**
 * La pasarela vuelve a /pago/exito y /pago/cancelado sin identificar la venta
 * (la URL de éxito/cancelación es fija, configurada una vez en el servidor).
 * useCheckout guarda acá el id antes de mandar a la clienta a pagar, así esta
 * pantalla puede consultar el estado real en vez de confiar en la ruta.
 */
const VENTA_ID_STORAGE_KEY = "mirroria_pago_venta_id"

export function PagoPage() {
  const location = useLocation()

  if (location.pathname === "/pago/exito" || location.pathname === "/pago/cancelado") {
    return <RegresoPasarela cancelado={location.pathname === "/pago/cancelado"} />
  }

  return <InstruccionesPago />
}

function InstruccionesPago() {
  const { ventaId } = useParams<{ ventaId: string }>()
  const [searchParams] = useSearchParams()
  const metodo = (searchParams.get("metodo") === "EFECTIVO" ? "EFECTIVO" : "QR") as Exclude<
    MetodoPago,
    "TARJETA"
  >

  const [instrucciones, setInstrucciones] = useState<Instrucciones | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const solicitado = useRef(false)

  useEffect(() => {
    if (!ventaId || solicitado.current) return
    solicitado.current = true
    paymentsApi
      .iniciarManual(ventaId, metodo)
      .then(setInstrucciones)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudieron generar las instrucciones de pago")
      )
      .finally(() => setIsLoading(false))
  }, [ventaId, metodo])

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

  const esQr = instrucciones.metodo === "QR"

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6">
      {esQr ? <QrCode className="size-12 text-primary" /> : <Money className="size-12 text-primary" />}
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {esQr ? "Pagá con QR" : "Pagá en efectivo"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{instrucciones.instrucciones}</p>

      <Card className="mt-6 w-full">
        <CardContent className="flex flex-col items-center gap-4">
          {esQr &&
            (instrucciones.qrUrl ? (
              <img
                src={instrucciones.qrUrl}
                alt="Código QR para pagar"
                className="size-56 rounded-xl border border-border/80 object-contain"
              />
            ) : (
              <Alert>
                <AlertDescription>
                  Todavía no tenemos la imagen del QR configurada. Mostrale tu referencia al
                  equipo para que te la facilite.
                </AlertDescription>
              </Alert>
            ))}

          <div>
            <p className="text-sm text-muted-foreground">Monto a pagar</p>
            <p className="text-2xl font-semibold">{formatMoney(instrucciones.montoCents)}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Referencia</p>
            <Badge variant="outline" className="mt-1 font-mono text-sm">
              {instrucciones.referencia}
            </Badge>
          </div>
        </CardContent>
      </Card>

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

function RegresoPasarela({ cancelado }: { cancelado: boolean }) {
  const [ventaId] = useState(() => sessionStorage.getItem(VENTA_ID_STORAGE_KEY))
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
          <p className="mt-2 text-sm text-muted-foreground">
            No completaste el pago con tarjeta. Tu compra sigue pendiente — podés volver a
            intentarlo desde el checkout.
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

      <div className="mt-8 flex gap-3">
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
