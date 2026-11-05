import { Link } from "react-router-dom"
import { EstadoBadge } from "@/components/common/EstadoBadge"
import { buttonVariants } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "cn"
import type { InquilinoResumenDto } from "../types/plataforma.types"

export function InquilinoRow({ inquilino: i }: { inquilino: InquilinoResumenDto }) {
  const pocosDias = i.suscripcion.estado === "TRIAL" && i.suscripcion.diasRestantes <= 7
  return (
    <TableRow>
      <TableCell>
        <p className="font-medium text-foreground">{i.nombre}</p>
        <p className="font-mono text-xs text-muted-foreground">/t/{i.slug}</p>
      </TableCell>
      <TableCell><EstadoBadge estado={i.estado} /></TableCell>
      <TableCell className="text-sm">{i.plan.nombre}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <EstadoBadge estado={i.suscripcion.estado} />
          <span className={cn("text-xs", pocosDias ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
            {i.suscripcion.diasRestantes} días restantes
          </span>
        </div>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {i.uso.sucursales} suc · {i.uso.productos} prendas · {i.uso.usuariosStaff} staff
      </TableCell>
      <TableCell className="text-xs">
        {i.propietario ? (
          <>
            <p className="text-foreground">{i.propietario.fullName}</p>
            <p className="font-mono text-muted-foreground">{i.propietario.email}</p>
          </>
        ) : "—"}
      </TableCell>
      <TableCell className="text-right">
        <Link to={`/plataforma/inquilinos/${i.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Gestionar
        </Link>
      </TableCell>
    </TableRow>
  )
}
