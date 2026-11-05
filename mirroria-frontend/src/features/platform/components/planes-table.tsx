import { PencilSimple, Power } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoneyEntero, formatUsd } from "@/lib/money"
import type { PlanDto } from "../types/plataforma.types"

const head = "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
const lim = (n: number | null) => n ?? "∞"

interface Props {
  planes: PlanDto[]
  cambiando: string | null
  onEditar: (p: PlanDto) => void
  onAlternarActivo: (p: PlanDto) => void
}

export function PlanesTable({ planes, cambiando, onEditar, onAlternarActivo }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            {["Plan", "Precio", "Sucursales", "Prendas", "Staff", "Prueba", "Estado", ""].map((c) => <TableHead key={c} className={head}>{c}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {planes.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <p className="font-medium">{p.nombre}</p>
                <p className="font-mono text-xs text-muted-foreground">{p.codigo} · orden {p.orden}</p>
              </TableCell>
              <TableCell>
                <p>{formatMoneyEntero(p.precioMensualCents)}</p>
                <p className="text-xs text-muted-foreground">{formatUsd(p.precioMensualUsdCents)}</p>
              </TableCell>
              <TableCell>{lim(p.limites.maxSucursales)}</TableCell>
              <TableCell>{lim(p.limites.maxProductos)}</TableCell>
              <TableCell>{lim(p.limites.maxUsuariosStaff)}</TableCell>
              <TableCell>{p.diasPrueba} días</TableCell>
              <TableCell>
                <Badge variant="outline" className={p.activo ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-border bg-muted text-muted-foreground"}>
                  {p.activo ? "Ofrecido" : "Retirado"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEditar(p)} className="gap-1"><PencilSimple /> Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => onAlternarActivo(p)} disabled={cambiando === p.id} className="gap-1">
                    <Power /> {p.activo ? "Retirar" : "Ofrecer"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
