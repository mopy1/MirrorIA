import { TableCell, TableFooter, TableRow } from "@/components/ui/table"
import { formatearPorcentaje, formatearValor } from "../lib/report-value.utils"
import type { FilaReporte, Variacion } from "../types/reports.types"
import { claseVariacion } from "../lib/tabla-dinamica.utils"

interface Props {
  filas: FilaReporte[]
  metrica: string
  variaciones?: Variacion[]
}

/** Total de las filas visibles (respeta la búsqueda) y su variación ponderada contra el período anterior. */
export function TablaDinamicaTotales({ filas, metrica, variaciones }: Props) {
  if (filas.length < 2) return null
  const total = filas.reduce((acc, f) => acc + (Number(f.valor) || 0), 0)
  const anterior = variaciones
    ? filas.reduce((acc, f) => acc + (Number(variaciones.find((x) => x.clave === f.clave)?.anterior) || 0), 0)
    : 0
  const delta = variaciones && anterior > 0 ? ((total - anterior) / anterior) * 100 : null

  return (
    <TableFooter>
      <TableRow>
        <TableCell className="font-semibold text-foreground">Total</TableCell>
        <TableCell className="text-right font-semibold tabular-nums text-foreground">{formatearValor(total, metrica)}</TableCell>
        {variaciones && <TableCell className="text-right tabular-nums text-muted-foreground">{formatearValor(anterior, metrica)}</TableCell>}
        {variaciones && (
          <TableCell className={`text-right font-medium tabular-nums ${claseVariacion(delta)}`}>
            {delta === null ? "Sin datos antes" : formatearPorcentaje(delta, true)}
          </TableCell>
        )}
      </TableRow>
    </TableFooter>
  )
}
