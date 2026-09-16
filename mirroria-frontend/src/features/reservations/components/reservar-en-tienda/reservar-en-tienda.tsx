import { CalendarBlank } from "@phosphor-icons/react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { useCreateResource } from "@/hooks/useCreateResource"
import { reservationsApi } from "../../api/reservationsApi"

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
 * Simplificación real: reserva una sola variante a la vez (la ya
 * seleccionada en la ficha), no un carrito de varias prendas distintas en
 * una sola reserva — RF09 pide "seleccionar varias prendas", que acá se
 * cubre agregando más de una reserva si hace falta, no fusionándolas en un
 * flujo tipo carrito aparte (hubiera duplicado casi toda la feature `cart`).
 */
export function ReservarEnTienda({ varianteId, sucursalId }: ReservarEnTiendaProps) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [fechaHora, setFechaHora] = useState("")
  const [cantidad, setCantidad] = useState("1")
  const [feedback, setFeedback] = useState<string | null>(null)
  const { submit, isLoading, error } = useCreateResource(reservationsApi.create)

  async function handleReservar() {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    if (!varianteId || !sucursalId || !fechaHora) return
    setFeedback(null)
    const result = await submit({
      sucursalId,
      fechaHoraPrevista: new Date(fechaHora).toISOString(),
      items: [{ varianteId, cantidad: Number(cantidad) }],
    })
    if (result) setFeedback("Reserva creada — la vas a ver en \"Mis reservas\".")
  }

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <CalendarBlank className="size-4" />
        ¿Preferís probártela antes? Reservala en tienda
      </p>
      {!sucursalId ? (
        <p className="text-xs text-muted-foreground">Elegí una sucursal arriba para reservar ahí.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="fecha-reserva">
              Fecha y hora
            </label>
            <Input
              id="fecha-reserva"
              type="datetime-local"
              value={fechaHora}
              onChange={(e) => setFechaHora(e.target.value)}
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="cantidad-reserva">
              Cantidad
            </label>
            <Input
              id="cantidad-reserva"
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-20"
            />
          </div>
          <Button
            variant="outline"
            disabled={!varianteId || !fechaHora || isLoading}
            onClick={handleReservar}
          >
            Reservar
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {feedback && (
        <p role="status" className="text-xs text-foreground">
          {feedback}
        </p>
      )}
    </div>
  )
}
