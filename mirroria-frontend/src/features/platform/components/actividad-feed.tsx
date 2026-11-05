import { ClockCounterClockwise } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { EVENTOS, TONO_PUNTO } from "../lib/eventos"
import { haceCuanto } from "../lib/indicadores"
import type { EventoPlataformaDto } from "../types/plataforma.types"

/** Bitácora: "Casa Andina cambió de plan · Básico → Crecimiento · hace 2 h". */
export function ActividadFeed({ eventos, conTienda = true }: { eventos: EventoPlataformaDto[]; conTienda?: boolean }) {
  if (eventos.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <ClockCounterClockwise className="size-5" /> Sin movimientos todavía. Las altas, cambios de plan y ediciones de marca aparecen acá.
      </p>
    )
  }
  return (
    <ol className="space-y-3">
      {eventos.map((e) => {
        const cfg = EVENTOS[e.tipo] ?? { texto: e.tipo, tono: "neutro" as const }
        return (
          <li key={e.id} className="flex gap-3 text-sm">
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TONO_PUNTO[cfg.tono]}`} aria-hidden />
            <div className="min-w-0">
              <p>
                {conTienda && <Link to={`/plataforma/inquilinos/${e.tienda.id}`} className="font-medium hover:underline">{e.tienda.nombre} </Link>}
                {conTienda ? cfg.texto : cfg.texto.charAt(0).toUpperCase() + cfg.texto.slice(1)}
                {e.detalle && <span className="text-muted-foreground"> · {e.detalle}</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {haceCuanto(e.createdAt)}
                {e.actorRol === "PLATAFORMA" ? " · por la plataforma" : e.actorRol === "SISTEMA" ? " · automático" : e.actorEmail ? ` · ${e.actorEmail}` : ""}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
