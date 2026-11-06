import { ArrowClockwise, Info, Question } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

interface PrediccionesEncabezadoProps {
  cargando: boolean
  esEstimacion: boolean
  onActualizar: () => void
  onComoSeCalcula: () => void
}

/** Título, bajada humana, aviso amable si es una estimación y acceso a "¿Cómo se calcula?". */
export function PrediccionesEncabezado({ cargando, esEstimacion, onActualizar, onComoSeCalcula }: PrediccionesEncabezadoProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Predicciones</h1>
          <p className="max-w-[60ch] text-sm text-muted-foreground text-pretty">
            Lo que probablemente pase en las próximas semanas y qué conviene hacer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onComoSeCalcula}>
            <Question data-icon="inline-start" aria-hidden /> ¿Cómo se calcula?
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onActualizar}
            disabled={cargando}
            aria-label={cargando ? "Actualizando predicciones" : "Actualizar predicciones"}
            title="Actualizar"
          >
            <ArrowClockwise className={cn("size-4", cargando && "animate-spin")} aria-hidden />
          </Button>
        </div>
      </div>

      {esEstimacion && (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-foreground/85">
          <Info className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" weight="fill" aria-hidden />
          <span>
            Mostrando una estimación aproximada: el servicio de predicción no respondió.{" "}
            <button
              type="button"
              onClick={onActualizar}
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              Volver a intentar
            </button>
          </span>
        </p>
      )}
    </header>
  )
}
