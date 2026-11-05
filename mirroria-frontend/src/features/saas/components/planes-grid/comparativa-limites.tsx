import { Check } from "@phosphor-icons/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoneyEntero } from "@/lib/money"
import { FILAS_LIMITES, INCLUIDO_EN_TODOS, PLAN_DESTACADO } from "../../lib/planes"
import type { PlanDto } from "../../types/saas.types"
import { cn } from "cn"

const head = "text-xs font-semibold uppercase tracking-wider text-muted-foreground"

/** Tabla comparativa de límites (solo se muestra con planes cargados). */
export function ComparativaLimites({ planes }: { planes: PlanDto[] }) {
  if (planes.length === 0) return null
  const col = (p: PlanDto) => cn("text-center", p.codigo === PLAN_DESTACADO && "bg-primary/5")
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className={head}>Comparar planes</TableHead>
            {planes.map((p) => (
              <TableHead key={p.id} className={cn(head, col(p))}>
                {p.nombre}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Precio mensual</TableCell>
            {planes.map((p) => (
              <TableCell key={p.id} className={col(p)}>
                {formatMoneyEntero(p.precioMensualCents)}
              </TableCell>
            ))}
          </TableRow>
          {FILAS_LIMITES.map((f) => (
            <TableRow key={f.clave}>
              <TableCell className="font-medium first-letter:uppercase">{f.plural}</TableCell>
              {planes.map((p) => (
                <TableCell key={p.id} className={col(p)}>
                  {p.limites[f.clave] ?? "Ilimitadas"}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {INCLUIDO_EN_TODOS.map((item) => (
            <TableRow key={item}>
              <TableCell className="text-muted-foreground">{item}</TableCell>
              {planes.map((p) => (
                <TableCell key={p.id} className={col(p)}>
                  <Check className="mx-auto size-4 text-primary" weight="bold" aria-label="Incluido" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
