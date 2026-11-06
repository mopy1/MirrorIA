import { Brain, ArrowClockwise, Database } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MlHeaderProps {
  esFallback?: boolean
  cargando?: boolean
  onActualizar: () => void
}

/** Cabecera del panel de ML con monitor de inferencia (FastAPI 8002) y refresco. */
export function MlHeader({ esFallback, cargando, onActualizar }: MlHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary shadow-xs">
          <Brain className="size-6" weight="duotone" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Predicciones & Machine Learning
            </h1>
            {esFallback ? (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 text-[10px] font-mono">
                ▲ Modo Heurístico (Fallback Activo)
              </Badge>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600 font-mono">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Inferencia en Vivo · FastAPI :8002
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Proyecciones inteligentes de demanda, asistencia a probador, valor de clientas y control de caja.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Badge variant="outline" className="hidden text-[10px] text-muted-foreground sm:inline-flex items-center gap-1">
          <Database className="size-3 text-muted-foreground/80" />
          <span>N=10.000 · seed=42</span>
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={onActualizar}
          disabled={cargando}
          className="gap-1.5 text-xs font-medium shadow-xs"
        >
          <ArrowClockwise className={`size-3.5 ${cargando ? "animate-spin" : ""}`} />
          <span>{cargando ? "Actualizando..." : "Actualizar"}</span>
        </Button>
      </div>
    </div>
  )
}
