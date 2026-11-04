import { useState, type FormEvent } from "react"
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
import { FieldGroup } from "@/components/ui/field"
import type { Sucursal } from "@/features/branches/types/branches.types"
import type { Proveedor } from "@/features/providers/types/providers.types"
import { purchaseOrdersApi } from "../../api/purchaseOrdersApi"
import type { CreateOrdenCompraItemDto } from "../../types/purchase-orders.types"
import { OrdenCabeceraFields } from "./orden-cabecera-fields"
import { OrdenItemsSelector } from "./orden-items-selector"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  proveedores: Proveedor[]
  sucursales: Sucursal[]
  onSuccess: () => void
}

export function CrearOrdenCompraDialog({
  open,
  onOpenChange,
  proveedores,
  sucursales,
  onSuccess,
}: Props) {
  const [proveedorId, setProveedorId] = useState("")
  const [sucursalDestinoId, setSucursalDestinoId] = useState("")
  const [fechaEsperada, setFechaEsperada] = useState("")
  const [items, setItems] = useState<CreateOrdenCompraItemDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setProveedorId("")
    setSucursalDestinoId("")
    setFechaEsperada("")
    setItems([])
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!proveedorId || !sucursalDestinoId || items.length === 0) {
      setError("Completa proveedor, sucursal y al menos una prenda")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await purchaseOrdersApi.createOrden({
        proveedorId,
        sucursalDestinoId,
        items,
        fechaEsperada: fechaEsperada || undefined,
      })
      reset()
      onOpenChange(false)
      onSuccess()
    } catch {
      setError("No se pudo crear la orden de compra")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = proveedorId && sucursalDestinoId && items.length > 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Compra</DialogTitle>
          <DialogDescription>Solicita reposición o stock de prendas a un proveedor.</DialogDescription>
        </DialogHeader>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup className="py-0 gap-3">
            <OrdenCabeceraFields
              proveedorId={proveedorId}
              onProveedorChange={setProveedorId}
              sucursalDestinoId={sucursalDestinoId}
              onSucursalChange={setSucursalDestinoId}
              fechaEsperada={fechaEsperada}
              onFechaChange={setFechaEsperada}
              proveedores={proveedores}
              sucursales={sucursales}
            />
            <OrdenItemsSelector items={items} onChange={setItems} />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !isFormValid}>
              {isLoading ? "Creando..." : "Crear Orden"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
