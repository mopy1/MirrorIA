import { CheckCircle, Circle, SpinnerGap } from "@phosphor-icons/react"
import { cn } from "cn"
import { ETAPAS_REPORTE } from "../../lib/etapas-reporte"

/** Lista de etapas: hechas (check), actual (girando) y pendientes. Avanzan por tiempo, no es un progreso medido. */
export function EtapasProgreso({ actual }: { actual: number }) {
  return (
    <ol className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6" aria-label="Qué está haciendo la IA">
      {ETAPAS_REPORTE.map((etapa, i) => {
        const estado = i < actual ? "hecha" : i === actual ? "actual" : "pendiente"
        const Icono = estado === "hecha" ? CheckCircle : estado === "actual" ? SpinnerGap : Circle
        return (
          <li
            key={etapa}
            aria-current={estado === "actual" ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors duration-200",
              estado === "pendiente" ? "text-muted-foreground/70" : "text-foreground",
              estado === "actual" && "font-medium",
            )}
          >
            <Icono
              weight={estado === "hecha" ? "fill" : "regular"}
              className={cn("size-4 shrink-0", estado === "hecha" && "text-primary", estado === "actual" && "text-primary motion-safe:animate-spin")}
              aria-hidden
            />
            {etapa}
          </li>
        )
      })}
    </ol>
  )
}
