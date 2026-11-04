import { useEffect, useState } from "react"
import { CircleNotch } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ApiError } from "@/lib/api"
import { purchaseOrdersApi } from "../../api/purchaseOrdersApi"
import type { OrdenCompra } from "../../types/purchase-orders.types"

interface Props {
  orden: OrdenCompra | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

/** Confirmación antes de cancelar: lo pendiente sale del tránsito y lo ya
 * recibido queda en stock (no se revierte). */
export function CancelarOrdenDialog({ orden, onOpenChange, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => setError(null), [orden])

  const pendientes = orden?.items.reduce((a, i) => a + i.cantidadPedida - i.cantidadRecibida, 0) ?? 0

  async function confirmar() {
    if (!orden) return
    setIsLoading(true)
    setError(null)
    try {
      await purchaseOrdersApi.cancelarOrden(orden.id)
      onOpenChange(false)
      onSuccess()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cancelar la orden")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={Boolean(orden)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Cancelar la orden #{orden?.id.slice(0, 8)}?</DialogTitle>
          <DialogDescription>
            Las {pendientes} u. que faltaban recibir dejan de figurar en tránsito. Lo ya recibido
            se queda en stock. No se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Volver</Button>
          <Button type="button" variant="destructive" onClick={confirmar} disabled={isLoading}>
            {isLoading && <CircleNotch data-icon="inline-start" className="animate-spin" />}
            {isLoading ? "Cancelando..." : "Sí, cancelar orden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
