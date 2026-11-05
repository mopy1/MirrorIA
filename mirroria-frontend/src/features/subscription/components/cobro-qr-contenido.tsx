import { CheckCircle, CircleNotch, Lightning, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatMoneyEntero } from "@/lib/money"
import type { CobroSuscripcionResponseDto } from "../types/suscripcion.types"

interface CobroQrContenidoProps {
  cobro: CobroSuscripcionResponseDto
  pagado: boolean
  isLoadingSimulacion: boolean
  error: string | null
  simularPago: () => Promise<unknown>
}

const ES_LOCAL = typeof window !== "undefined" && (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  import.meta.env.DEV
)

export function CobroQrContenido({
  cobro,
  pagado,
  isLoadingSimulacion,
  error,
  simularPago,
}: CobroQrContenidoProps) {
  if (pagado) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center animate-in fade-in duration-300">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle weight="fill" className="size-8" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight">¡Pago acreditado con éxito!</h3>
        <p className="text-sm text-muted-foreground">Tu suscripción SaaS fue renovada. Redirigiendo a tu panel...</p>
      </div>
    )
  }

  const qrSrc = cobro.qrBase64?.startsWith("data:")
    ? cobro.qrBase64
    : `data:image/png;base64,${cobro.qrBase64}`

  return (
    <div className="space-y-4 text-center">
      <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Importe a pagar</p>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {formatMoneyEntero(cobro.montoCents)}
        </p>
      </div>

      {cobro.qrBase64 && (
        <div className="mx-auto w-52 max-w-[80%] rounded-xl border border-border/80 bg-white p-2.5 shadow-xs">
          <img
            src={qrSrc}
            alt="Código QR de cobro de suscripción"
            className="aspect-square w-full rounded-lg"
          />
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground" role="status">
        <CircleNotch className="size-3.5 animate-spin text-primary" />
        <span>Esperando confirmación del banco...</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Abrí la app de tu banco boliviano favorito, escaneá el QR y confirmá el pago.
      </p>

      {error && (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {ES_LOCAL && (
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={simularPago}
            disabled={isLoadingSimulacion || pagado}
            className="w-full gap-2 border-dashed border-amber-500/40 text-xs text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
          >
            {isLoadingSimulacion ? <CircleNotch className="size-3.5 animate-spin" /> : <Lightning />}
            Simular pago bancario (entorno dev)
          </Button>
        </div>
      )}
    </div>
  )
}
