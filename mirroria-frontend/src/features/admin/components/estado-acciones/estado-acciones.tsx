import { Button } from "@/components/ui/button"
import { reservationsApi } from "@/features/reservations/api/reservationsApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { cn } from "cn"

const TRANSICIONES: Record<string, { estado: string; label: string; variant?: "default" | "outline" | "ghost"; className?: string }[]> = {
  PENDIENTE: [
    { estado: "CONFIRMADA", label: "Confirmar", variant: "default", className: "h-7 text-xs px-2.5" },
    // La clienta llegó antes de que se confirmara: un paso en vez de dos.
    { estado: "EN_TIENDA", label: "Cliente llegó", variant: "outline", className: "h-7 text-xs px-2.5" },
    { estado: "CANCELADA", label: "Cancelar", variant: "ghost", className: "h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10" },
    { estado: "EXPIRADA", label: "Expirar", variant: "outline", className: "h-7 text-xs px-2 text-muted-foreground" },
  ],
  CONFIRMADA: [
    { estado: "EN_TIENDA", label: "Cliente llegó", variant: "default", className: "h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white" },
    { estado: "CANCELADA", label: "Cancelar", variant: "ghost", className: "h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10" },
    { estado: "NO_SHOW", label: "No asistió", variant: "outline", className: "h-7 text-xs px-2 text-muted-foreground" },
    { estado: "EXPIRADA", label: "Expirar", variant: "outline", className: "h-7 text-xs px-2 text-muted-foreground" },
  ],
  // Se probó y no compró: libera las prendas apartadas (no cuenta como falta).
  // Si compra, lo hace ELLA desde "Mis reservas" (POST /ventas/desde-reserva/:id);
  // el efectivo lo confirma la cajera en Cobros y ahí la reserva pasa a COMPLETADA.
  EN_TIENDA: [
    { estado: "CANCELADA", label: "No compró", variant: "outline", className: "h-7 text-xs px-2.5" },
  ],
}

interface EstadoAccionesProps {
  reservaId: string
  estadoActual: string
  onCambiado: () => void
}

export function EstadoAcciones({ reservaId, estadoActual, onCambiado }: EstadoAccionesProps) {
  const { submit, isLoading } = useCreateResource((estado: string) =>
    reservationsApi.cambiarEstado(reservaId, estado)
  )
  const opciones = TRANSICIONES[estadoActual] ?? []

  if (opciones.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  async function handleClick(estado: string) {
    const result = await submit(estado)
    if (result) onCambiado()
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 justify-end">
      {estadoActual === "EN_TIENDA" && (
        <span className="text-[11px] text-muted-foreground" title="La clienta compra lo reservado desde su cuenta; si paga en efectivo, se confirma en Cobros por confirmar y la reserva se completa sola.">
          Compra desde su reserva · efectivo en Cobros
        </span>
      )}
      {opciones.map((op) => (
        <Button
          key={op.estado}
          size="sm"
          variant={op.variant ?? "outline"}
          disabled={isLoading}
          className={cn(op.className)}
          onClick={() => handleClick(op.estado)}
        >
          {op.label}
        </Button>
      ))}
    </div>
  )
}
