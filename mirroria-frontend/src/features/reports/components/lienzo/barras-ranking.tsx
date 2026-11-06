import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { FilaGrafico } from "../../lib/report-chart.utils"
import { formatearValor } from "../../lib/report-value.utils"

const VISIBLES = 10

interface BarrasRankingProps {
  filas: FilaGrafico[]
  metrica: string
  /** Nombre accesible de la lista ("Unidades vendidas por prenda"). */
  titulo: string
}

/**
 * Ranking legible: nombre completo arriba, valor al final y barra proporcional al mayor.
 * HTML en vez de un eje de Recharts: nunca saltea ni trunca etiquetas y funciona a 375 px.
 */
export function BarrasRanking({ filas, metrica, titulo }: BarrasRankingProps) {
  const [todas, setTodas] = useState(false)
  const maximo = Math.max(...filas.map((f) => f.valor), 0)
  const visibles = todas ? filas : filas.slice(0, VISIBLES)
  const ocultas = filas.length - visibles.length

  return (
    <div className="min-w-0">
      <ol aria-label={titulo} className="flex flex-col gap-3.5">
        {visibles.map((f) => (
          <li key={f.clave} className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-sm text-foreground break-words">{f.etiqueta}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatearValor(f.valor, metrica)}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${maximo > 0 ? Math.max((f.valor / maximo) * 100, 1.5) : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
      {(ocultas > 0 || todas) && filas.length > VISIBLES && (
        <Button variant="ghost" size="sm" className="mt-3 -ml-2 text-muted-foreground" onClick={() => setTodas((v) => !v)}>
          {todas ? "Mostrar menos" : `Mostrar ${ocultas} más`}
        </Button>
      )}
    </div>
  )
}
