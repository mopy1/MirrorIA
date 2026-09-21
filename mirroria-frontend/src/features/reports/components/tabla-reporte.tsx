import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Reporte } from "../types/reports.types"

/**
 * Cuando hay comparacion se muestran las dos columnas y la variacion; si no,
 * una sola columna de valor. Un delta porcentual nulo se dibuja como "—":
 * significa que antes no habia base, no que no cambio.
 */
export function TablaReporte({ reporte }: { reporte: Reporte }) {
  const variaciones = reporte.comparacion?.variaciones

  if (reporte.filas.length === 0) {
    return <p className="text-sm text-muted-foreground">La consulta no devolvió resultados.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Concepto</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          {variaciones && <TableHead className="text-right">Período anterior</TableHead>}
          {variaciones && <TableHead className="text-right">Variación</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {reporte.filas.map((fila) => {
          const v = variaciones?.find((x) => x.clave === fila.clave)
          return (
            <TableRow key={fila.clave}>
              <TableCell className="whitespace-normal font-medium">{fila.etiqueta}</TableCell>
              <TableCell className="text-right tabular-nums">
                {fila.valor.toLocaleString("es-BO")}
              </TableCell>
              {variaciones && (
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {v ? v.anterior.toLocaleString("es-BO") : "—"}
                </TableCell>
              )}
              {variaciones && (
                <TableCell
                  className={
                    "text-right tabular-nums " +
                    (v?.deltaPorcentual != null
                      ? v.deltaPorcentual > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : v.deltaPorcentual < 0
                          ? "text-destructive"
                          : ""
                      : "text-muted-foreground")
                  }
                >
                  {v?.deltaPorcentual === null || v === undefined
                    ? "—"
                    : `${v.deltaPorcentual > 0 ? "+" : ""}${v.deltaPorcentual}%`}
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
