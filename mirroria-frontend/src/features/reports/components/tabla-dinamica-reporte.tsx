import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { useTablaDinamica } from "../hooks/useTablaDinamica"
import { capitalizar, dimensionDelReporte, esMetricaAditiva, metricaDelReporte, nombreDimension, nombreMetrica, opcionesPivote } from "../lib/report-metricas"
import { formatearPorcentaje, formatearValor } from "../lib/report-value.utils"
import { claseVariacion } from "../lib/tabla-dinamica.utils"
import type { Reporte } from "../types/reports.types"
import { TablaDinamicaCabecera } from "./tabla-dinamica-cabecera"
import { TablaDinamicaToolbar } from "./tabla-dinamica-toolbar"
import { TablaDinamicaTotales } from "./tabla-dinamica-totales"
import { etiquetaFila } from "../lib/report-etiquetas"

interface Props {
  reporte: Reporte
  onPivoteChange?: (dimension: string) => void
}

/** Tabla de "Datos": buscar, ordenar por columna, reagrupar y totales. Scroll horizontal solo dentro de su caja. */
export function TablaDinamicaReporte({ reporte, onPivoteChange }: Props) {
  const { busqueda, setBusqueda, columnaOrden, direccionOrden, conmutarOrden, filas, totalFilas } = useTablaDinamica(reporte)
  const metricaId = metricaDelReporte(reporte)
  const metrica = metricaId ?? ""
  const dimension = dimensionDelReporte(reporte)
  const variaciones = reporte.comparacion?.variaciones
  const columnas = variaciones ? 4 : 2
  const cabecera = { actual: columnaOrden, direccion: direccionOrden, onOrdenar: conmutarOrden }

  return (
    <div className="min-w-0">
      <TablaDinamicaToolbar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        dimensionActual={dimension}
        opciones={reporte.esSimulacion ? [] : opcionesPivote(metricaId)}
        onPivote={onPivoteChange}
        conteoFiltradas={filas.length}
        totalFilas={totalFilas}
      />
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TablaDinamicaCabecera columna="etiqueta" titulo={capitalizar(nombreDimension(dimension) ?? "detalle")} {...cabecera} />
              <TablaDinamicaCabecera columna="valor" titulo={reporte.esSimulacion ? "Con el escenario simulado" : capitalizar(nombreMetrica(metricaId).replace(/^(el|la|los|las)\s+/, ""))} alDerecha {...cabecera} />
              {variaciones && <TablaDinamicaCabecera columna="anterior" titulo="Período anterior" alDerecha {...cabecera} />}
              {variaciones && <TablaDinamicaCabecera columna="variacion" titulo="Cambio" alDerecha {...cabecera} />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas} className="h-20 text-center text-sm whitespace-normal text-muted-foreground">
                  Nada coincide con “{busqueda.trim()}”. Probá con otra palabra o borrá la búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              filas.map((fila) => {
                const v = variaciones?.find((x) => x.clave === fila.clave)
                return (
                  <TableRow key={fila.clave}>
                    <TableCell className="min-w-40 whitespace-normal">{etiquetaFila(fila.etiqueta, dimension)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatearValor(fila.valor, metrica)}</TableCell>
                    {variaciones && <TableCell className="text-right tabular-nums text-muted-foreground">{v ? formatearValor(v.anterior, metrica) : "Sin datos"}</TableCell>}
                    {variaciones && (
                      <TableCell className={`text-right tabular-nums ${claseVariacion(v?.deltaPorcentual)}`}>
                        {v?.deltaPorcentual == null ? "Sin datos antes" : formatearPorcentaje(v.deltaPorcentual, true)}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
          {esMetricaAditiva(metricaId) && <TablaDinamicaTotales filas={filas} metrica={metrica} variaciones={variaciones} />}
        </Table>
      </div>
    </div>
  )
}
