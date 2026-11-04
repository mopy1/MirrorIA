import { useEffect, useState } from "react"
import { ApiError } from "@/lib/api"
import { purchaseOrdersApi } from "../api/purchaseOrdersApi"
import type { CreateOrdenCompraItemDto } from "../types/purchase-orders.types"
import { useVariantesPorProveedor } from "./useVariantesPorProveedor"

export interface OrdenInicial {
  initialProveedorId?: string
  initialSucursalId?: string
  initialVarianteId?: string
}

/** Estado + submit del diálogo "Nueva orden de compra". Al abrirse arranca
 * desde los `initial*` (prellenado desde stock o desde un proveedor); si
 * solo viene la variante, el proveedor se deduce de su colección. */
export function useCrearOrdenForm(open: boolean, inicial: OrdenInicial, onDone: () => void) {
  const [proveedorId, setProveedorIdState] = useState("")
  const [sucursalDestinoId, setSucursalDestinoId] = useState("")
  const [fechaEsperada, setFechaEsperada] = useState("")
  const [items, setItems] = useState<CreateOrdenCompraItemDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { delProveedor, proveedorDe } = useVariantesPorProveedor(proveedorId)

  const { initialProveedorId, initialSucursalId, initialVarianteId } = inicial
  const proveedorInicial =
    initialProveedorId ?? (initialVarianteId ? proveedorDe(initialVarianteId) : "")

  useEffect(() => {
    if (!open) return
    setProveedorIdState(proveedorInicial)
    setSucursalDestinoId(initialSucursalId ?? "")
    setFechaEsperada("")
    setItems([])
    setError(null)
  }, [open, proveedorInicial, initialSucursalId])

  // Al cambiar de proveedor se descartan las prendas que no son suyas.
  function setProveedorId(id: string) {
    setProveedorIdState(id)
    setItems((prev) => prev.filter((i) => proveedorDe(i.varianteId) === id))
  }

  async function submit() {
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
      onDone()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo crear la orden de compra")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    proveedorId, setProveedorId, sucursalDestinoId, setSucursalDestinoId,
    fechaEsperada, setFechaEsperada, items, setItems,
    variantesDelProveedor: delProveedor, isLoading, error, submit,
  }
}
