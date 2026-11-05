import { ArrowSquareOut, ArrowsLeftRight, CalendarPlus, Pause, Play } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { EstadoBadge } from "@/components/common/EstadoBadge"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatFecha } from "@/lib/fechas"
import { cn } from "cn"
import type { InquilinoDetalleDto } from "../types/plataforma.types"

export type DialogoInquilino = "estado" | "plan" | "extender" | null

/** Cabecera del detalle: identidad, estados y acciones (1 primaria: extender). */
export function InquilinoCabecera({ i, onAbrir }: { i: InquilinoDetalleDto; onAbrir: (d: DialogoInquilino) => void }) {
  const suspendida = i.estado === "SUSPENDIDO"
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{i.nombre}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">/t/{i.slug} · alta {formatFecha(i.createdAt)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <EstadoBadge estado={i.estado} />
          <EstadoBadge estado={i.suscripcion.estado} />
          <span className="text-xs text-muted-foreground">
            Plan {i.plan.nombre} · vence {formatFecha(i.suscripcion.fin)} ({i.suscripcion.diasRestantes} días)
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={`/t/${i.slug}`} target="_blank" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowSquareOut /> Ver tienda
        </Link>
        <Button variant="outline" onClick={() => onAbrir("estado")} className="gap-1.5">
          {suspendida ? <Play /> : <Pause />} {suspendida ? "Reactivar" : "Suspender"}
        </Button>
        <Button variant="outline" onClick={() => onAbrir("plan")} className="gap-1.5">
          <ArrowsLeftRight /> Cambiar plan
        </Button>
        <Button onClick={() => onAbrir("extender")} className="gap-1.5">
          <CalendarPlus /> Extender vigencia
        </Button>
      </div>
    </div>
  )
}
