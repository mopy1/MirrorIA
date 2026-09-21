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
 * La pasarela vuelve a /pago/exito y /pago/cancelado con el id de la venta
 * como parámetro (`?venta=...`), agregado por el backend a las URL de
 * éxito/cancelación. sessionStorage queda como respaldo para una
 * configuración vieja sin el parámetro, pero falla si la clienta vuelve en
 * otra pestaña, en otro dispositivo, o si borró datos de navegación —
 * useCheckout lo sigue guardando ahí antes de mandarla a pagar.
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
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const metodo = (searchParams.get("metodo") === "EFECTIVO" ? "EFECTIVO" : "QR") as Exclude<
    MetodoPago,
    "TARJETA"
  >
  // Por qué llegó acá, cuando no vino eligiendo: el checkout la manda para
  // este lado si el cobro con tarjeta no se pudo iniciar (503 sin claves de
  // Stripe). Su carrito ya está vacío, así que este es el único camino abierto.
  const motivo = (location.state as { motivo?: string } | null)?.motivo ?? null

  const [instrucciones, setInstrucciones] = useState<Instrucciones | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Guarda por venta Y método: sin el método, cambiar de QR a efectivo no
  // volvería a pedir las instrucciones. El backend reutiliza la misma fila
  // pendiente, así que cambiar de idea no duplica el cobro.
  const solicitado = useRef<string | null>(null)

  useEffect(() => {
    if (!ventaId) return
    const clave = `${ventaId}:${metodo}`
    if (solicitado.current === clave) return
    solicitado.current = clave
    setIsLoading(true)
    setError(null)
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

      {motivo && (
        <Alert className="mt-6 text-left">
          <WarningCircle />
          <AlertDescription>
            {motivo} Tu compra ya está reservada: podés pagarla por QR o en efectivo desde acá.
          </AlertDescription>
        </Alert>
      )}

      {/* Cambiar de idea no crea otro cobro: el backend reutiliza la misma
          fila pendiente de esta venta y solo le cambia el método. */}
      <div className="mt-6 flex gap-2">
        <Button
          variant={esQr ? "default" : "outline"}
          onClick={() => setSearchParams({ metodo: "QR" }, { replace: true })}
        >
          <QrCode data-icon="inline-start" className="size-4" />
          <span>Con QR</span>
        </Button>
        <Button
          variant={esQr ? "outline" : "default"}
          onClick={() => setSearchParams({ metodo: "EFECTIVO" }, { replace: true })}
        >
          <Money data-icon="inline-start" className="size-4" />
          <span>En efectivo</span>
        </Button>
      </div>

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
            Pagar por QR o efectivo
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
