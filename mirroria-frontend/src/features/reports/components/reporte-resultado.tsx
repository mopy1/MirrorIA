import { Lightning } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ReasoningSteps } from "./reasoning-steps/reasoning-steps"
import { ReportChart } from "./report-chart"
import { TablaDinamicaReporte } from "./tabla-dinamica-reporte"
import type { Reporte } from "../types/reports.types"

interface Props {
  reporte: Reporte
  onPivoteChange?: (dimension: string) => void
}

export function ReporteResultado({ reporte, onPivoteChange }: Props) {
  const tieneFilas = reporte.filas && reporte.filas.length > 0

  return (
    <Card className="border bg-card">
      <CardContent className="p-5 flex flex-col gap-4">
        {reporte.esSimulacion && (
          <div className="flex items-center gap-1.5 self-start">
            <Badge
              variant="outline"
              className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-normal"
            >
              <Lightning className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span>Escenario Simulado DuckDB</span>
            </Badge>
          </div>
        )}

        {reporte.pasosEjecutados && reporte.pasosEjecutados.length > 0 && (
          <ReasoningSteps pasos={reporte.pasosEjecutados} />
        )}

        {reporte.narrativa ? (
          <p className="text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-line">
            {reporte.narrativa}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No se generó un resumen para esta consulta, pero los datos de abajo salen igual de la
            base de datos.
          </p>
        )}

        {tieneFilas ? (
          <>
            <ReportChart reporte={reporte} />
            <TablaDinamicaReporte reporte={reporte} onPivoteChange={onPivoteChange} />
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Esta consulta no produjo series numéricas tabuladas adicionales.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
