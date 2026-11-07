import { CheckCircle } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { VarianteConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import type { Venta } from "@/features/checkout/types/checkout.types"
import type { Reserva } from "../types/reservations.types"
import { codigoReserva } from "../lib/codigoReserva"
import { puedeComprarReserva, ventaPendienteDeReserva } from "../lib/comprarReserva"
import { etiquetaEstadoReserva } from "../lib/estadoReserva"
import { ComprarReserva } from "./comprar-reserva"

const CANCELABLES = ["PENDIENTE", "CONFIRMADA"]

interface ReservaCardProps {
  reserva: Reserva
  sucursal?: { nombre: string; ciudadNombre: string }
  variantes: VarianteConProducto[]
  ventas: Venta[]
  online: boolean
  isCancelando: boolean
  onCancelar: (id: string) => void
  onCambio: () => void
}

export function ReservaCard({ reserva, sucursal, variantes, ventas, online, isCancelando, onCancelar, onCambio }: ReservaCardProps) {
  const fecha = new Date(reserva.fechaHoraPrevista).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" })
  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">{sucursal ? `${sucursal.nombre} — ${sucursal.ciudadNombre}` : reserva.sucursalId}</p>
          <p className="text-sm text-muted-foreground">{fecha}</p>
          <p className="mt-1 text-sm text-foreground">
            Código de tu reserva: <span className="font-mono font-semibold tracking-wider">#{codigoReserva(reserva.id)}</span>
          </p>
        </div>
        <Badge variant={reserva.estado === "EN_TIENDA" ? "default" : "secondary"}>{etiquetaEstadoReserva(reserva.estado)}</Badge>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {reserva.items.map((item) => {
          const v = variantes.find((x) => x.varianteId === item.varianteId)
          return (
            <li key={item.id}>
              {v ? `${v.productoTitulo} (${v.tallaNombre} · ${v.colorNombre})` : item.varianteId} × {item.cantidad}
            </li>
          )
        })}
      </ul>

      {puedeComprarReserva(reserva.estado) && (
        <ComprarReserva reservaId={reserva.id} ventaPendiente={ventaPendienteDeReserva(ventas, reserva.id)} online={online} onCambio={onCambio} />
      )}
      {reserva.estado === "COMPLETADA" && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle className="size-4" /> Compraste y pagaste lo que reservaste.
        </p>
      )}
      {CANCELABLES.includes(reserva.estado) && (
        <Button variant="outline" size="sm" className="mt-4" disabled={isCancelando || !online} onClick={() => onCancelar(reserva.id)}>
          Cancelar reserva
        </Button>
      )}
    </div>
  )
}
