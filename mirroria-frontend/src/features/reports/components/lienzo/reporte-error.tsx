import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

interface ReporteErrorProps {
  mensaje: string
  onReintentar?: () => void
}

/** Error al armar el reporte: qué pasó (mensaje del backend), cómo seguir y un ejemplo de pregunta que sí funciona. */
export function ReporteError({ mensaje, onReintentar }: ReporteErrorProps) {
  return (
    <article role="alert" className="min-w-0 rounded-xl border border-border bg-card px-4 py-8 sm:px-7">
      <div className="flex max-w-xl flex-col items-start gap-3">
        <WarningCircle className="size-6 text-destructive" aria-hidden />
        <h2 className="text-lg font-semibold text-foreground">No pudimos armar este reporte</h2>
        <p className="text-sm text-pretty text-muted-foreground">{mensaje}</p>
        <p className="text-sm text-pretty text-muted-foreground">
          Si el problema era la pregunta, probá con algo concreto como{" "}
          <span className="text-foreground">“¿Qué prendas vendí más este mes?”</span>
        </p>
        {onReintentar && (
          <Button size="lg" className="mt-2" onClick={onReintentar}>
            <ArrowClockwise className="size-4" aria-hidden />
            Reintentar
          </Button>
        )}
      </div>
    </article>
  )
}
