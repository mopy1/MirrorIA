import { WarningCircle } from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import { cn } from "cn"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/money"
import { useCobroQr } from "../hooks/useCobroQr"
import { QrPagado } from "./qr-pagado"

/** Pagar con QR: un código por compra, con su monto. La pantalla cambia sola
 * cuando el banco avisa que se pagó — nadie tiene que confirmarlo a mano. */
export function PagoQr() {
  const { ventaId } = useParams<{ ventaId: string }>()
  const { cobro, estado, transaccion, pagadoEn, error, isLoading } = useCobroQr(ventaId)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Skeleton className="h-[30rem] w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !cobro) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Alert variant="destructive">
          <AlertDescription>{error ?? "No pudimos generar el QR de pago."}</AlertDescription>
        </Alert>
        <Link to="/tienda" className={cn(buttonVariants({ variant: "outline" }), "mt-6 w-full")}>
          Volver a la tienda
        </Link>
      </div>
    )
  }

  if (estado === "PAGADO") {
    return <QrPagado cobro={cobro} transaccion={transaccion} pagadoEn={pagadoEn} />
  }

  const vencido = estado === "VENCIDO"

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Pagá con QR</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Abrí la app de tu banco, elegí pagar con QR y escaneá este código.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="flex items-baseline justify-between gap-4 border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Total a pagar</p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatMoney(cobro.montoCents)}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-foreground">{cobro.comercio}</p>
            <p className="font-mono text-muted-foreground">{cobro.referencia}</p>
          </div>
        </div>

        <div className="relative mx-auto my-6 w-64 max-w-[78%]">
          <img
            src={cobro.qrImagen}
            alt={`Código QR para pagar ${formatMoney(cobro.montoCents)} a ${cobro.comercio}`}
            className={cn("aspect-square w-full rounded-lg bg-white p-2", vencido && "opacity-15")}
          />
          {vencido && (
            <p className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
              QR vencido
            </p>
          )}
        </div>

        <div className="border-t border-border/70 px-5 py-4">
          {vencido ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <WarningCircle className="size-4 shrink-0" />
              Esta compra venció sin pagarse y su stock volvió a la tienda.
            </p>
          ) : (
            <p className="flex items-center gap-2.5 text-sm font-medium" role="status">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              Esperando el pago
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Esta pantalla se actualiza sola apenas el banco confirma el pago.
      </p>

      <Link to="/tienda" className={cn(buttonVariants({ variant: "outline" }), "mt-8")}>
        Volver a la tienda
      </Link>
    </div>
  )
}
