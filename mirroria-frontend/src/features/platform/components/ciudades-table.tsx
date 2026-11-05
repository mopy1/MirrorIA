import { MapPin } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Ciudad } from "@/features/branches/types/branches.types"

const head = "text-xs font-semibold uppercase tracking-wider text-muted-foreground"

export function CiudadesTable({ ciudades }: { ciudades: Ciudad[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className={head}>Ciudad</TableHead>
            <TableHead className={head}>País</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ciudades.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <span className="flex items-center gap-2 font-medium"><MapPin className="size-4 text-primary" /> {c.nombre}</span>
              </TableCell>
              <TableCell><Badge variant="outline" className="font-normal">{c.pais}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
