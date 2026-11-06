import { ArrowsClockwise, WarningCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

interface BloqueErrorProps {
  titulo?: string
  onReintentar: () => void
  reintentando?: boolean
}

/** Error con salida: qué falló y un botón para volver a intentar. */
export function BloqueError({ titulo = "No pudimos cargar los datos del tablero", onReintentar, reintentando }: BloqueErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
      <WarningCircle className="size-5 shrink-0 text-amber-600" weight="fill" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Puede ser la conexión a internet o que el servidor tardó en responder. Tus datos no se perdieron.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onReintentar} disabled={reintentando} className="gap-1.5">
        <ArrowsClockwise className={reintentando ? "animate-spin" : undefined} />
        Reintentar
      </Button>
    </div>
  )
}
