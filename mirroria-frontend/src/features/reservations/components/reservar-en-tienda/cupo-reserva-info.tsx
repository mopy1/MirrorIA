import { Warning } from "@phosphor-icons/react"
import type { CupoReserva } from "../../types/reservations.types"

const TOLERANCIA_DEFAULT = 30

/** Aviso de reglas + estado del cupo, debajo del formulario de reserva. */
export function CupoReservaInfo({ cupo }: { cupo: CupoReserva | null }) {
  const tolerancia = cupo?.toleranciaMinutos ?? TOLERANCIA_DEFAULT

  return (
    <div className="flex flex-col gap-1">
      {cupo && !cupo.puedeReservar && cupo.motivo && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-destructive">
          <Warning className="mt-px size-3.5 shrink-0" />
          {cupo.motivo}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Si no llegás hasta {tolerancia} min después de la hora, la reserva vence sola y cuenta
        como falta.
      </p>
      {cupo && (
        <p className="text-xs text-muted-foreground">
          Reservas activas: {cupo.reservasActivas} de {cupo.maxReservasActivas}
        </p>
      )}
    </div>
  )
}
