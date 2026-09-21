import { useState } from "react"
import { Sparkle, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import { reportsApi } from "@/features/reports/api/reportsApi"
import { TablaReporte } from "@/features/reports/components/tabla-reporte"
import type { Reporte } from "@/features/reports/types/reports.types"

const EJEMPLOS = [
  "¿Cuánto vendí este mes por sucursal?",
  "Top 5 productos más vendidos en agosto",
  "¿Cuántas reservas se cancelaron?",
  "Ingresos de agosto comparados con julio",
]

export function ReportesAdminPage() {
  const [pregunta, setPregunta] = useState("")
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function preguntar(texto: string) {
    if (texto.trim().length < 3) return
    setCargando(true)
    setError(null)
    try {
      setReporte(await reportsApi.preguntar(texto))
    } catch (e) {
      setReporte(null)
      setError(e instanceof ApiError ? e.message : "No se pudo generar el reporte")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
          <Sparkle className="size-7 text-primary" />
          Reportes por IA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preguntá en tus palabras. Los números salen siempre de la base de datos.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void preguntar(pregunta)
            }}
          >
            <Input
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="¿Cuánto vendí este mes por sucursal?"
              aria-label="Pregunta de negocio"
            />
            <Button type="submit" disabled={cargando}>
              {cargando ? "Consultando…" : "Consultar"}
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {EJEMPLOS.map((ej) => (
              <Button
                key={ej}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full font-normal"
                disabled={cargando}
                onClick={() => {
                  setPregunta(ej)
                  void preguntar(ej)
                }}
              >
                {ej}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {reporte && (
        <Card>
          <CardContent className="space-y-4">
            {reporte.narrativa ? (
              <p className="text-base leading-relaxed">{reporte.narrativa}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No se generó un resumen para esta consulta, pero los datos de abajo salen
                igual de la base de datos.
              </p>
            )}
            <TablaReporte reporte={reporte} />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none font-medium text-foreground">
                Cómo se entendió la pregunta
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3">
                {JSON.stringify(reporte.ficha, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
