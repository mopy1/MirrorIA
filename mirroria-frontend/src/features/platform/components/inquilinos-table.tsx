import { useState } from "react"
import { ArrowClockwise, Storefront, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InquilinoResumenDto } from "../types/plataforma.types"
import { InquilinoRow } from "./inquilino-row"

const head = "text-xs font-semibold text-muted-foreground bg-muted/40"
const COLUMNAS = ["Tienda", "Dueña", "Plan", "Suscripción", "Uso", "Alta", ""]
const POR_PAGINA = 20

interface Props {
  inquilinos: InquilinoResumenDto[] | null
  isLoading: boolean
  error: string | null
  hayFiltros: boolean
  onReintentar: () => void
  onLimpiarFiltros: () => void
}

/** Tabla de tiendas con 4 estados y paginado en el cliente de a 20 (el endpoint devuelve todas). */
export function InquilinosTable({ inquilinos, isLoading, error, hayFiltros, onReintentar, onLimpiarFiltros }: Props) {
  const [pagina, setPagina] = useState(0)
  if (isLoading) return <Skeleton className="h-96 rounded-xl" />
  if (error) {
    return (
      <Alert variant="destructive">
        <WarningCircle weight="fill" />
        <AlertDescription>{error}</AlertDescription>
        <AlertAction><Button size="sm" variant="outline" onClick={onReintentar} className="gap-1.5"><ArrowClockwise /> Reintentar</Button></AlertAction>
      </Alert>
    )
  }
  if (!inquilinos || inquilinos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
        <Storefront className="size-10 text-primary" weight="light" />
        <p className="font-medium">{hayFiltros ? "Ninguna tienda coincide." : "Todavía no se registró ninguna tienda."}</p>
        {hayFiltros ? (
          <Button variant="outline" onClick={onLimpiarFiltros}>Limpiar filtros</Button>
        ) : (
          <p className="text-sm text-muted-foreground">Aparecen acá cuando alguien completa el alta en /registro-tienda.</p>
        )}
      </div>
    )
  }
  const paginas = Math.ceil(inquilinos.length / POR_PAGINA)
  const actual = Math.min(pagina, paginas - 1)
  const visibles = inquilinos.slice(actual * POR_PAGINA, (actual + 1) * POR_PAGINA)
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>{COLUMNAS.map((c) => <TableHead key={c} className={head}>{c}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>{visibles.map((i) => <InquilinoRow key={i.id} inquilino={i} />)}</TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{inquilinos.length} {inquilinos.length === 1 ? "tienda" : "tiendas"}</span>
        {paginas > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={actual === 0} onClick={() => setPagina(actual - 1)}>Anterior</Button>
            <span className="tabular-nums">{actual + 1} de {paginas}</span>
            <Button variant="outline" size="sm" disabled={actual >= paginas - 1} onClick={() => setPagina(actual + 1)}>Siguiente</Button>
          </div>
        )}
      </div>
    </div>
  )
}
