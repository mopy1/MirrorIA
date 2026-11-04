import { useEffect, useState, type FormEvent } from "react"
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
import { useVariantesConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import { ApiError } from "@/lib/api"
import { purchaseOrdersApi } from "../../api/purchaseOrdersApi"
import type { OrdenCompra } from "../../types/purchase-orders.types"
import { RecibirItemRow } from "./recibir-item-row"

interface Props {
  orden: OrdenCompra | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RecibirOrdenDialog({ orden, open, onOpenChange, onSuccess }: Props) {
  const { variantes } = useVariantesConProducto()
  const [cantidades, setCantidades] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orden) return
    const init: Record<string, number> = {}
    for (const item of orden.items) {
      init[item.varianteId] = Math.max(0, item.cantidadPedida - item.cantidadRecibida)
    }
    setCantidades(init)
    setError(null)
  }, [orden, open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!orden) return
    const itemsDto = orden.items
      .map((it) => ({
        varianteId: it.varianteId,
        cantidadRecibida: Number(cantidades[it.varianteId] ?? 0),
      }))
      .filter((it) => it.cantidadRecibida > 0)

    if (itemsDto.length === 0) {
      setError("Ingresa al menos una unidad para recibir")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await purchaseOrdersApi.recibirOrden(orden.id, { items: itemsDto })
      onOpenChange(false)
      onSuccess()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error al registrar la recepción de mercadería")
    } finally {
      setIsLoading(false)
    }
  }

  const totalARecibir = Object.values(cantidades).reduce((a, b) => a + (Number(b) || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Recepción de Mercadería</DialogTitle>
          <DialogDescription>
            {orden ? `Orden #${orden.id.slice(0, 8)} · Registra las prendas físicas recibidas.` : ""}
          </DialogDescription>
        </DialogHeader>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
            {orden?.items.map((item) => (
              <RecibirItemRow
                key={item.varianteId}
                item={item}
                variantes={variantes}
                cantidad={cantidades[item.varianteId] ?? 0}
                onChangeCantidad={(id, val) => setCantidades((prev) => ({ ...prev, [id]: val }))}
              />
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || totalARecibir <= 0}>
              {isLoading ? "Recibiendo..." : `Confirmar Recepción (${totalARecibir} u.)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
