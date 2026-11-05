import { ArrowSquareOut, ArrowsLeftRight, CalendarPlus, Play } from "@phosphor-icons/react"
import { EstadoBadge } from "@/components/common/EstadoBadge"
import { ImagenMarca } from "@/components/marca/imagen-marca"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatFecha } from "@/lib/fechas"
import { cn } from "cn"
import type { InquilinoDetalleDto } from "../types/plataforma.types"
import { AccionesMenu } from "./detalle/acciones-menu"
import type { DialogoInquilino } from "./detalle/tipos"
import { MiniaturaTienda } from "./miniatura-tienda"

export type { DialogoInquilino }

/** Primario contextual: reactivar si está suspendida; si no, extender la prueba o cambiar de plan. */
function primario(i: InquilinoDetalleDto) {
  if (i.estado === "SUSPENDIDO") return { d: "estado" as const, label: "Reactivar", icono: Play }
  if (i.suscripcion.estado === "TRIAL") return { d: "extender" as const, label: "Extender prueba", icono: CalendarPlus }
  return { d: "plan" as const, label: "Cambiar plan", icono: ArrowsLeftRight }
}

/** Cabecera del detalle: franja con SU portada, logo, estados y acciones. */
export function InquilinoCabecera({ i, onAbrir }: { i: InquilinoDetalleDto; onAbrir: (d: DialogoInquilino) => void }) {
  const p = primario(i)
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="relative h-28 bg-muted">
        <ImagenMarca src={i.marca?.heroImagenUrl} alt="" className="h-full w-full object-cover object-[50%_30%]" respaldo={null} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
      </div>
      {/* `relative`: sin él, la fila quedaba debajo del degradado absoluto de la portada (botones tapados). */}
      <div className="relative -mt-8 flex flex-col gap-4 px-5 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-end gap-4">
          <MiniaturaTienda nombre={i.nombre} marca={i.marca} className="size-16 shrink-0 rounded-xl text-lg shadow-sm ring-4 ring-card" />
          <div className="min-w-0 pb-0.5">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{i.nombre}</h1>
            <p className="font-mono text-sm whitespace-nowrap text-muted-foreground">/t/{i.slug} · alta {formatFecha(i.createdAt)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <EstadoBadge estado={i.estado} />
              <EstadoBadge estado={i.suscripcion.estado} />
              <Badge variant="outline">Plan {i.plan.nombre}</Badge>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a href={`/t/${i.slug}`} target="_blank" rel="noopener" className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}>
            <ArrowSquareOut /> Ver tienda
          </a>
          <Button onClick={() => onAbrir(p.d)} className="gap-1.5"><p.icono /> {p.label}</Button>
          <AccionesMenu i={i} onAbrir={onAbrir} />
        </div>
      </div>
    </div>
  )
}
