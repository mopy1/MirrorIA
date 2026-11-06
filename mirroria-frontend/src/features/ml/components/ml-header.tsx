import { Brain, ArrowClockwise, GraduationCap } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MlHeaderProps {
  esFallback?: boolean
  cargando?: boolean
  onActualizar: () => void
  onAbrirFichaTecnica?: () => void
}

/** Cabecera ejecutiva del módulo ML orientada a Gerente Comercial y Director de Tienda. */
export function MlHeader({
  esFallback,
  cargando,
  onActualizar,
  onAbrirFichaTecnica,
}: MlHeaderProps) {
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
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-600 text-[10px] font-mono"
              >
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
            Proyecciones comerciales de demanda, asistencia a probador, fidelización y control POS.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        {onAbrirFichaTecnica && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAbrirFichaTecnica}
            className="gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground shadow-xs"
            title="Abrir respaldo académico y citas bibliográficas (SI2)"
          >
            <GraduationCap className="size-4 text-primary" weight="duotone" />
            <span>Ficha Técnica Metodológica</span>
          </Button>
        )}
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
