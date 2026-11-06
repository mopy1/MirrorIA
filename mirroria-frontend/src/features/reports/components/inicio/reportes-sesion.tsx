import { ArrowRight, ChartBar, SpinnerGap, WarningCircle } from "@phosphor-icons/react"
import type { TabReporte } from "../../types/chat.types"

interface ReportesSesionProps {
  reportes: TabReporte[]
  onAbrir: (id: string) => void
}

const hora = new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit" })

function Estado({ tab }: { tab: TabReporte }) {
  if (tab.cargando) return <span className="text-primary">Generando…</span>
  if (tab.error) return <span className="text-destructive">No se pudo generar</span>
  return <span>Listo{tab.generadoEn ? ` · ${hora.format(tab.generadoEn)}` : ""}</span>
}

function Icono({ tab }: { tab: TabReporte }) {
  if (tab.cargando) return <SpinnerGap className="size-4 shrink-0 animate-spin text-primary" />
  if (tab.error) return <WarningCircle className="size-4 shrink-0 text-destructive" />
  return <ChartBar className="size-4 shrink-0 text-muted-foreground" />
}

/** Atajo a los reportes abiertos en esta visita (no se guardan al salir de la página). */
export function ReportesSesion({ reportes, onAbrir }: ReportesSesionProps) {
  if (reportes.length === 0) return null
  return (
    <section aria-labelledby="titulo-sesion" className="space-y-3">
      <div className="space-y-0.5">
        <h2 id="titulo-sesion" className="text-base font-semibold">Reportes de esta sesión</h2>
        <p className="text-sm text-muted-foreground">Siguen abiertos en las pestañas hasta que salgas de esta página.</p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {reportes.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              onClick={() => onAbrir(tab.id)}
              className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <Icono tab={tab} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{tab.titulo}</span>
                <span className="block text-xs text-muted-foreground">
                  <Estado tab={tab} />
                </span>
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
