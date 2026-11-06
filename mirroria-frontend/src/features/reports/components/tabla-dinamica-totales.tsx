import { TableCell, TableFooter, TableRow } from "@/components/ui/table"
import { formatearValor } from "../lib/report-value.utils"
import type { FilaReporte, Reporte } from "../types/reports.types"

interface Props {
  filas: FilaReporte[]
  reporte: Reporte
}

export function TablaDinamicaTotales({ filas, reporte }: Props) {
  if (filas.length === 0) return null

  const metrica = reporte.ficha.metrica
  const variaciones = reporte.comparacion?.variaciones

  const totalActual = filas.reduce((acc, f) => acc + (Number(f.valor) || 0), 0)

  let totalAnterior = 0
  let deltaPonderado: number | null = null

  if (variaciones) {
    totalAnterior = filas.reduce((acc, f) => {
      const v = variaciones.find((x) => x.clave === f.clave)
      return acc + (v ? Number(v.anterior) || 0 : 0)
    }, 0)

    if (totalAnterior > 0) {
      deltaPonderado = Math.round(((totalActual - totalAnterior) / totalAnterior) * 1000) / 10
    }
  }

  return (
    <TableFooter className="bg-muted/50 border-t font-semibold">
      <TableRow>
        <TableCell className="font-bold text-foreground">TOTAL GENERAL</TableCell>
        <TableCell className="text-right tabular-nums font-bold text-foreground">
          {formatearValor(totalActual, metrica)}
        </TableCell>
        {variaciones && (
          <TableCell className="text-right tabular-nums text-muted-foreground font-medium">
            {formatearValor(totalAnterior, metrica)}
          </TableCell>
        )}
        {variaciones && (
          <TableCell
            className={
              "text-right tabular-nums font-bold " +
              (deltaPonderado != null
                ? deltaPonderado > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : deltaPonderado < 0
                    ? "text-destructive"
                    : ""
                : "text-muted-foreground")
            }
          >
            {deltaPonderado == null ? "—" : `${deltaPonderado > 0 ? "+" : ""}${deltaPonderado}%`}
          </TableCell>
        )}
      </TableRow>
    </TableFooter>
  )
}
