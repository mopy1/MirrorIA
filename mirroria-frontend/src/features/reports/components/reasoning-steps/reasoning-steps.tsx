import { CaretRight, ChartLineUp, Database, Package, Sparkle, type Icon } from "@phosphor-icons/react"
import { describirPaso, plural, type TipoPaso } from "../../lib/lienzo-pasos"
import type { PasoEjecutado } from "../../types/reports-hybrid.types"

const ICONOS: Record<TipoPaso, Icon> = {
  consulta: Database,
  proveedores: Package,
  simulacion: ChartLineUp,
  otro: Sparkle,
}

interface ReasoningStepsProps {
  pasos: PasoEjecutado[]
}

/**
 * "Cómo se armó este reporte": colapsado por defecto (es transparencia, no lo que hay que leer).
 * `<details>` nativo: abre con teclado y lector de pantalla sin JS extra.
 */
export function ReasoningSteps({ pasos }: ReasoningStepsProps) {
  if (!pasos || pasos.length === 0) return null
  const humanos = pasos.map(describirPaso)

  return (
    <details className="group min-w-0">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md py-1 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <CaretRight className="size-3.5 text-muted-foreground transition-transform duration-200 group-open:rotate-90" aria-hidden />
        Cómo se armó este reporte
        <span className="font-normal text-muted-foreground">· {plural(pasos.length, "paso")}</span>
      </summary>
      <ol className="mt-3 flex flex-col gap-3 pl-5.5">
        {humanos.map((p) => {
          const Icono = ICONOS[p.tipo]
          return (
            <li key={p.id} className="flex items-start gap-2.5 text-sm">
              <Icono className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-foreground">{p.titulo}</p>
                {p.detalle && <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{p.detalle}</p>}
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 pl-5.5 text-xs text-muted-foreground">
        Las cifras salen directo de tu tienda; la IA solo elige qué consultar y redacta el análisis.
      </p>
    </details>
  )
}
