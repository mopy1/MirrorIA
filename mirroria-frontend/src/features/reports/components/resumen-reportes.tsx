import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/money"
import { useReportesIniciales } from "../hooks/useReportesIniciales"
import { ReportChart } from "./report-chart"

/** Grilla de reportes ya armados al entrar a la pantalla — ver
 * `useReportesIniciales` para de dónde salen los datos (sin pasar por el
 * modelo de IA). Números arriba para el vistazo rápido, gráficos abajo para
 * la lectura visual — no reemplaza el detalle que da `ReporteResultado`
 * para una pregunta puntual. */
export function ResumenReportes() {
  const resultados = useReportesIniciales()
  const stats = resultados.filter((r) => r.tipo === "stat")
  const graficos = resultados.filter((r) => r.tipo === "chart")

  // `@container` en vez de `sm:`/sizes por viewport: en esta pantalla el
  // ancho real de la grilla no es el ancho de la ventana, es lo que sobra
  // después del panel de chat fijo (hasta 28rem) — a 1440px de viewport eso
  // dejaba ~660px de contenido real, `sm:grid-cols-4` igual disparaba 4
  // columnas angostas y "Bs 31.325,00" se salía de la tarjeta. La query de
  // contenedor reacciona al ancho real del propio grid, no al de la ventana.
  return (
    <div className="@container space-y-6">
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
        {stats.map((r) => {
          const valor = r.reporte?.filas[0]?.valor ?? 0
          return (
            <Card key={r.id} className="min-w-0">
              <CardContent className="min-w-0 space-y-1 p-4">
                <p className="truncate text-xs text-muted-foreground">{r.titulo}</p>
                {r.cargando ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <p className="truncate text-xl font-semibold tabular-nums">
                    {r.reporte ? (r.esMoneda ? formatMoney(valor) : valor.toLocaleString("es-BO")) : "—"}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
        {graficos.map((r) => (
          <Card key={r.id} className="min-w-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{r.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              {r.cargando ? (
                <Skeleton className="h-40 w-full" />
              ) : r.reporte ? (
                <ReportChart reporte={r.reporte} />
              ) : (
                <p className="text-sm text-muted-foreground">No se pudo cargar.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
