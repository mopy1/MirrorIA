import { ArrowSquareOut, DotsThree, LinkSimple } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { EstadoBadge } from "@/components/common/EstadoBadge"
import { Button, buttonVariants } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TableCell, TableRow } from "@/components/ui/table"
import { formatFecha } from "@/lib/fechas"
import { cn } from "cn"
import type { InquilinoResumenDto } from "../types/plataforma.types"
import { MiniaturaTienda } from "./miniatura-tienda"
import { UsoMini } from "./uso-mini"

/** Una tienda en el listado: su marca en miniatura, dueña, plan, suscripción, uso, alta y acciones. */
export function InquilinoRow({ inquilino: i }: { inquilino: InquilinoResumenDto }) {
  const pocosDias = i.suscripcion.estado === "TRIAL" && i.suscripcion.diasRestantes <= 7
  const enlace = `${window.location.origin}/t/${i.slug}`
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <MiniaturaTienda nombre={i.nombre} marca={i.marca} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-foreground">{i.nombre} {i.estado === "SUSPENDIDO" && <EstadoBadge estado={i.estado} />}</p>
            <p className="font-mono text-xs text-muted-foreground">/t/{i.slug}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-xs">
        {i.propietario ? (<><p className="text-foreground">{i.propietario.fullName}</p><p className="font-mono text-muted-foreground">{i.propietario.email}</p></>) : <span className="text-muted-foreground">Sin dueña registrada</span>}
      </TableCell>
      <TableCell className="text-sm">{i.plan.nombre}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <EstadoBadge estado={i.suscripcion.estado} />
          <span className={cn("text-xs", pocosDias ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>{i.suscripcion.diasRestantes} días</span>
        </div>
      </TableCell>
      <TableCell><UsoMini uso={i.uso} /></TableCell>
      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{formatFecha(i.createdAt)}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Link to={`/plataforma/inquilinos/${i.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Gestionar</Link>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Más acciones de ${i.nombre}`}><DotsThree weight="bold" /></Button>} />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`/t/${i.slug}`, "_blank", "noopener")}><ArrowSquareOut /> Ver tienda</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void navigator.clipboard?.writeText(enlace)}><LinkSimple /> Copiar enlace</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}
