import { ArrowClockwise, Storefront, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InquilinoResumenDto } from "../types/plataforma.types"
import { InquilinoRow } from "./inquilino-row"

const head = "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
const COLUMNAS = ["Tienda", "Estado", "Plan", "Suscripción", "Uso", "Dueña", ""]

interface Props {
  inquilinos: InquilinoResumenDto[] | null
  isLoading: boolean
  error: string | null
  hayFiltros: boolean
  onReintentar: () => void
  onLimpiarFiltros: () => void
}

export function InquilinosTable({ inquilinos, isLoading, error, hayFiltros, onReintentar, onLimpiarFiltros }: Props) {
  if (isLoading) return <Skeleton className="h-72 rounded-xl" />
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
        <p className="font-medium">{hayFiltros ? "Ninguna tienda coincide con los filtros." : "Todavía no se registró ninguna tienda."}</p>
        {hayFiltros ? (
          <Button variant="outline" onClick={onLimpiarFiltros}>Limpiar filtros</Button>
        ) : (
          <p className="text-sm text-muted-foreground">Las tiendas aparecen acá cuando alguien completa el alta en /registro-tienda.</p>
        )}
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>{COLUMNAS.map((c) => <TableHead key={c} className={head}>{c}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {inquilinos.map((i) => <InquilinoRow key={i.id} inquilino={i} />)}
        </TableBody>
      </Table>
    </div>
  )
}
