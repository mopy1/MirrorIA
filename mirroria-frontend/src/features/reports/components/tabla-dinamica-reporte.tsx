import { CaretDown, CaretUp, CaretUpDown } from "@phosphor-icons/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTablaDinamica, type ColumnaOrden } from "../hooks/useTablaDinamica"
import { formatearValor } from "../lib/report-value.utils"
import type { Reporte } from "../types/reports.types"
import { TablaDinamicaToolbar } from "./tabla-dinamica-toolbar"
import { TablaDinamicaTotales } from "./tabla-dinamica-totales"

interface Props {
  reporte: Reporte
  onPivoteChange?: (dimension: string) => void
}

function claseVariacion(delta: number | null | undefined): string {
  if (delta == null) return "text-muted-foreground"
  if (delta > 0) return "text-emerald-600 dark:text-emerald-400"
  if (delta < 0) return "text-destructive"
  return "text-muted-foreground"
}

export function TablaDinamicaReporte({ reporte, onPivoteChange }: Props) {
  const {
    busqueda,
    setBusqueda,
    columnaOrden,
    direccionOrden,
    conmutarOrden,
    filas,
    totalFilas,
    exportando,
    descargarExcel,
  } = useTablaDinamica(reporte, onPivoteChange)

  const variaciones = reporte.comparacion?.variaciones

  function renderIcono(col: ColumnaOrden) {
    if (columnaOrden !== col) return <CaretUpDown className="size-3 text-muted-foreground ml-1 inline" />
    return direccionOrden === "asc" ? (
      <CaretUp className="size-3 text-primary ml-1 inline" />
    ) : (
      <CaretDown className="size-3 text-primary ml-1 inline" />
    )
  }

  return (
    <div className="space-y-3">
      <TablaDinamicaToolbar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        dimensionActual={reporte.ficha.agruparPor}
        onPivote={onPivoteChange}
        onExportar={descargarExcel}
        exportando={exportando}
        conteoFiltradas={filas.length}
        totalFilas={totalFilas}
      />

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => conmutarOrden("etiqueta")} className="cursor-pointer select-none">
                <span className="flex items-center">Concepto {renderIcono("etiqueta")}</span>
              </TableHead>
              <TableHead onClick={() => conmutarOrden("valor")} className="cursor-pointer select-none text-right">
                <span className="flex items-center justify-end">Valor {renderIcono("valor")}</span>
              </TableHead>
              {variaciones && (
                <TableHead onClick={() => conmutarOrden("anterior")} className="cursor-pointer select-none text-right">
                  <span className="flex items-center justify-end">Período anterior {renderIcono("anterior")}</span>
                </TableHead>
              )}
              {variaciones && (
                <TableHead onClick={() => conmutarOrden("variacion")} className="cursor-pointer select-none text-right">
                  <span className="flex items-center justify-end">Variación {renderIcono("variacion")}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={variaciones ? 4 : 2} className="h-20 text-center text-xs text-muted-foreground">
                  No hay filas que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              filas.map((fila) => {
                const v = variaciones?.find((x) => x.clave === fila.clave)
                return (
                  <TableRow key={fila.clave}>
                    <TableCell className="font-medium whitespace-normal">{fila.etiqueta}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatearValor(fila.valor, reporte.ficha.metrica)}</TableCell>
                    {variaciones && (
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {v ? formatearValor(v.anterior, reporte.ficha.metrica) : "—"}
                      </TableCell>
                    )}
                    {variaciones && (
                      <TableCell className={`text-right tabular-nums font-semibold ${claseVariacion(v?.deltaPorcentual)}`}>
                        {v?.deltaPorcentual == null ? "—" : `${v.deltaPorcentual > 0 ? "+" : ""}${v.deltaPorcentual}%`}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
          <TablaDinamicaTotales filas={filas} reporte={reporte} />
        </Table>
      </div>
    </div>
  )
}
