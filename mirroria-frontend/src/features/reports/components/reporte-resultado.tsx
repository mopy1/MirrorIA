import { Card, CardContent } from "@/components/ui/card"
import { ReportChart } from "./report-chart"
import { TablaReporte } from "./tabla-reporte"
import type { Reporte } from "../types/reports.types"

/** Narrativa + gráfico + tabla, todo visible a la vez — antes vivían como
 * tabs que había que alternar; el usuario pidió verlos juntos. El gráfico
 * (si aplica, ver `ReportChart`) va primero por ser la lectura rápida, la
 * tabla abajo para el detalle exacto. Extraído de `ReportesAdminPage.tsx`
 * (Regla 1.B: páginas solo orquestan). */
export function ReporteResultado({ reporte }: { reporte: Reporte }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        {reporte.narrativa ? (
          <p className="text-base leading-relaxed">{reporte.narrativa}</p>
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
