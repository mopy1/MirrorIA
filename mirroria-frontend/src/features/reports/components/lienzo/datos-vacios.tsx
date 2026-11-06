import { Table } from "@phosphor-icons/react"

/** Vacío que enseña: la consulta corrió bien pero no hubo filas para ese período o filtro. */
export function DatosVacios() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
      <Table className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">No hubo datos para esta pregunta</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Puede que no haya movimientos en ese período. Probá con un rango más amplio, por ejemplo “en los últimos 3 meses”.
      </p>
    </div>
  )
}
