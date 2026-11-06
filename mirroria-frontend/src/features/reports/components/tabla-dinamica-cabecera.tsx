import { CaretDown, CaretUp, CaretUpDown } from "@phosphor-icons/react"
import { TableHead } from "@/components/ui/table"
import { cn } from "cn"
import type { ColumnaOrden, DireccionOrden } from "../lib/tabla-dinamica.utils"

interface Props {
  columna: ColumnaOrden
  titulo: string
  actual: ColumnaOrden
  direccion: DireccionOrden
  onOrdenar: (columna: ColumnaOrden) => void
  alDerecha?: boolean
}

/** Cabecera ordenable: botón real (teclado + foco visible) y `aria-sort` en la celda. */
export function TablaDinamicaCabecera({ columna, titulo, actual, direccion, onOrdenar, alDerecha }: Props) {
  const activa = actual === columna
  const Icono = !activa ? CaretUpDown : direccion === "asc" ? CaretUp : CaretDown
  return (
    <TableHead aria-sort={activa ? (direccion === "asc" ? "ascending" : "descending") : "none"} className={cn(alDerecha && "text-right")}>
      <button
        type="button"
        onClick={() => onOrdenar(columna)}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm font-medium outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
          activa ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {titulo}
        <Icono className={cn("size-3", activa ? "text-primary" : "text-muted-foreground")} aria-hidden />
      </button>
    </TableHead>
  )
}
