import { CalendarBlank } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CupoReservaInfo } from "./cupo-reserva-info"
import { useReservarEnTienda } from "./useReservarEnTienda"

interface ReservarEnTiendaProps {
  varianteId: string | null
  sucursalId: string | null
}

/**
 * RF09/RF10: reservar la prenda para probársela en tienda, en vez de
 * comprarla directo. Vive en `features/reservations/` (no en `catalog/`)
 * aunque se renderiza dentro de `product-detail` — mismo criterio que
 * `BranchPicker` de `features/branches/` importado ahí mismo.
 *
 * Reserva una sola unidad de la variante ya seleccionada en la ficha
 * (reglas anti-acaparamiento del backend: 1 unidad por variante, máx. 2
 * reservas activas, horario entre +30 min y +48 h — ver `useCupoReserva`).
 */
export function ReservarEnTienda({ varianteId, sucursalId }: ReservarEnTiendaProps) {
  const r = useReservarEnTienda(varianteId, sucursalId)

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <CalendarBlank className="size-4" />
        ¿Preferís probártela antes? Reservala en tienda
      </p>
      {!sucursalId ? (
        <p className="text-xs text-muted-foreground">Elegí una sucursal arriba para reservar ahí.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="fecha-reserva">
                Fecha y hora
              </label>
              <Input
                id="fecha-reserva"
                type="datetime-local"
                value={r.fechaHora}
                min={r.ventana.min}
                max={r.ventana.max}
                aria-invalid={r.fueraDeVentana || undefined}
                onChange={(e) => r.setFechaHora(e.target.value)}
                className="w-56"
              />
            </div>
            <Button
              variant="outline"
              disabled={!r.puedeEnviar || r.isLoading}
              onClick={r.reservar}
            >
              {r.isLoading ? "Reservando..." : "Reservar"}
            </Button>
          </div>
          {r.fueraDeVentana && (
            <p className="text-xs text-destructive">
              Elegí un horario entre {r.cupo?.anticipacionMinimaMinutos ?? 30} min y{" "}
              {r.cupo?.ventanaMaximaHoras ?? 48} h desde ahora.
            </p>
          )}
          <CupoReservaInfo cupo={r.cupo} />
        </>
      )}
      {r.error && (
        <p role="alert" className="text-xs text-destructive">
          {r.error}
        </p>
      )}
      {r.feedback && (
        <p role="status" className="text-xs text-foreground">
          {r.feedback}
        </p>
      )}
    </div>
  )
}
