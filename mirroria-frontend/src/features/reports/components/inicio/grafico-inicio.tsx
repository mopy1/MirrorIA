import { ArrowsClockwise, ChartBar, Sparkle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/money"
import { estadoGrafico } from "../../lib/inicio-graficos"
import type { Dato } from "../../lib/inicio-cifras"
import type { GraficoInicial } from "../../reportes-iniciales.data"
import { ReportChart } from "../report-chart"

interface GraficoInicioProps {
  def: GraficoInicial
  dato: Dato
  onReintentar: () => void
  onPreguntar: (texto: string) => void
  preguntando: boolean
}

function Aviso({ texto }: { texto: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg bg-muted/40 px-6 py-8 text-center">
      <ChartBar className="size-6 text-muted-foreground" />
      <p className="max-w-sm text-sm text-pretty text-muted-foreground">{texto}</p>
    </div>
  )
}

function Contenido({ def, dato, onReintentar }: Pick<GraficoInicioProps, "def" | "dato" | "onReintentar">) {
  if (dato === undefined) return <Skeleton className="h-56 w-full" />
  if (dato === null) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg bg-muted/40 px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">No se pudo cargar este gráfico.</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onReintentar}>
          <ArrowsClockwise className="size-3.5" />
          Reintentar
        </Button>
      </div>
    )
  }
  const estado = estadoGrafico(dato)
  if (estado.tipo === "vacio") return <Aviso texto={def.textoVacio} />
  if (estado.tipo === "unico") {
    const valor = def.esMoneda ? formatMoney(estado.valor) : estado.valor.toLocaleString("es-BO")
    return <Aviso texto={def.textoUnico(estado.etiqueta, valor)} />
  }
  return <ReportChart reporte={dato} />
}

/** Un gráfico del inicio con sus 4 estados y un atajo para pedirle el análisis a la IA. */
export function GraficoInicio({ def, dato, onReintentar, onPreguntar, preguntando }: GraficoInicioProps) {
  return (
    <section aria-label={def.titulo} className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{def.titulo}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-primary hover:text-primary"
          disabled={preguntando}
          onClick={() => onPreguntar(def.pregunta)}
        >
          <Sparkle className="size-3.5" weight="fill" />
          Analizar con IA
        </Button>
      </div>
      <div className="min-w-0">
        <Contenido def={def} dato={dato} onReintentar={onReintentar} />
      </div>
    </section>
  )
}
