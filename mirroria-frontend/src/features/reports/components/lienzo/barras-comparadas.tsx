import type { FilaGrafico } from "../../lib/report-chart.utils"
import { formatearPorcentaje, formatearValor } from "../../lib/report-value.utils"
import { cn } from "cn"
import { LeyendaSeries } from "./leyenda-series"

interface BarrasComparadasProps {
  filas: FilaGrafico[]
  metrica: string
  titulo: string
  /** Nombre de la serie principal (`valor`) y de la de referencia (`referencia`). */
  nombreValor: string
  nombreReferencia: string
}

function cambio(valor: number, referencia: number | undefined): { texto: string; clase: string } | null {
  if (referencia === undefined) return null
  if (referencia === 0) return valor === 0 ? null : { texto: "nuevo", clase: "text-muted-foreground" }
  const pct = ((valor - referencia) / referencia) * 100
  if (Math.abs(pct) < 0.05) return { texto: "sin cambios", clase: "text-muted-foreground" }
  return {
    texto: formatearPorcentaje(pct, true),
    clase: pct > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
  }
}

/** Dos barras por fila (actual vs. referencia) con nombre completo, valores y variación en texto. */
export function BarrasComparadas({ filas, metrica, titulo, nombreValor, nombreReferencia }: BarrasComparadasProps) {
  const maximo = Math.max(...filas.flatMap((f) => [f.valor, f.referencia ?? 0]), 0)
  const ancho = (v: number) => `${maximo > 0 ? Math.max((v / maximo) * 100, v > 0 ? 1.5 : 0) : 0}%`

  return (
    <div className="min-w-0">
      <LeyendaSeries series={[{ nombre: nombreValor, muestra: "bg-primary" }, { nombre: nombreReferencia, muestra: "bg-muted-foreground/35" }]} />
      <ol aria-label={titulo} className="flex flex-col gap-4">
        {filas.map((f) => {
          const c = cambio(f.valor, f.referencia)
          return (
            <li key={f.clave} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-sm text-foreground break-words">{f.etiqueta}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatearValor(f.valor, metrica)}</span>
              </div>
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                {nombreReferencia}: {formatearValor(f.referencia ?? 0, metrica)}
                {c && <span className={cn("ml-1.5 font-medium", c.clase)}>{c.texto}</span>}
              </p>
              <div className="mt-1.5 flex flex-col gap-[2px]" aria-hidden>
                <div className="h-2 rounded-full bg-primary" style={{ width: ancho(f.valor) }} />
                <div className="h-2 rounded-full bg-muted-foreground/35" style={{ width: ancho(f.referencia ?? 0) }} />
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
