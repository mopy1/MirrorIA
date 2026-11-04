import { Card, CardContent } from "@/components/ui/card"
import { ReasoningSteps } from "./reasoning-steps/reasoning-steps"
import { ReportChart } from "./report-chart"
import { TablaReporte } from "./tabla-reporte"
import type { Reporte } from "../types/reports.types"

export function ReporteResultado({ reporte }: { reporte: Reporte }) {
  return (
    <Card className="border bg-card">
      <CardContent className="p-5 flex flex-col gap-4">
        {reporte.pasosEjecutados && reporte.pasosEjecutados.length > 0 && (
          <ReasoningSteps pasos={reporte.pasosEjecutados} />
        )}

        {reporte.narrativa ? (
          <p className="text-sm sm:text-base leading-relaxed text-foreground">
            {reporte.narrativa}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No se generó un resumen para esta consulta, pero los datos de abajo salen igual
            de la base de datos.
          </p>
        )}

        <ReportChart reporte={reporte} />
        <TablaReporte reporte={reporte} />
      </CardContent>
    </Card>
  )
}
