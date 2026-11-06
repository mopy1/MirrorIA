import type { Reporte } from "../../types/reports.types"
import { ConstructorReporteDialog } from "../constructor-reporte"

/** Título de la página + bajada + acceso al constructor manual (secundario). */
export function EncabezadoReportes({ onReporteGenerado }: { onReporteGenerado: (r: Reporte, titulo: string) => void }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Reportes con IA</h1>
        <p className="max-w-prose text-sm text-pretty text-muted-foreground">
          Preguntá en tus palabras; la IA arma el reporte con los datos reales de tu tienda.
        </p>
      </div>
      <div className="shrink-0">
        <ConstructorReporteDialog onReporteGenerado={onReporteGenerado} />
      </div>
    </header>
  )
}
