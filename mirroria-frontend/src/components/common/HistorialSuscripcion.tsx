import { ClockCounterClockwise } from "@phosphor-icons/react"
import { EstadoBadge } from "@/components/common/EstadoBadge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney } from "@/lib/money"
import type { SuscripcionDto } from "@/types/plan.types"
import { formatFecha } from "@/lib/fechas"

const head = "text-xs font-semibold uppercase tracking-wider text-muted-foreground"

/** Historial de suscripciones (más nuevas primero). Lo usan subscription y platform. */
export function HistorialSuscripcion({ historial }: { historial: SuscripcionDto[] }) {
  if (historial.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <ClockCounterClockwise className="size-5" /> Todavía no hay movimientos en la suscripción.
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className={head}>Plan</TableHead>
            <TableHead className={head}>Estado</TableHead>
            <TableHead className={head}>Desde</TableHead>
            <TableHead className={head}>Hasta</TableHead>
            <TableHead className={head}>Precio</TableHead>
            <TableHead className={head}>Pago</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historial.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.plan.nombre}</TableCell>
              <TableCell><EstadoBadge estado={s.estado} /></TableCell>
              <TableCell>{formatFecha(s.inicio)}</TableCell>
              <TableCell>{formatFecha(s.fin)}</TableCell>
              <TableCell>{formatMoney(s.precioCents)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{s.proveedorPago ? `${s.proveedorPago} · ${s.referenciaPago ?? ""}` : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
