import { BadgeEstadoOutbox } from "@/components/common/badge-estado-outbox"
import type { OperacionOutbox } from "@/lib/offline/idb.types"

/** Reservas hechas sin red que todavía no confirmó el servidor (o que rechazó). */
export function ReservasEnCola({ operaciones }: { operaciones: OperacionOutbox[] }) {
  if (operaciones.length === 0) return null
  return (
    <div className="mt-8 space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Guardadas en este dispositivo</h2>
      {operaciones.map((op) => (
        <div key={op.id} className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-foreground">{op.descripcion}</p>
            <BadgeEstadoOutbox estado={op.estado} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {op.estado === "PENDIENTE" || op.estado === "ENVIANDO"
              ? "Se envía sola al volver la conexión. Hasta entonces la prenda no está apartada."
              : op.error}
          </p>
        </div>
      ))}
    </div>
  )
}
