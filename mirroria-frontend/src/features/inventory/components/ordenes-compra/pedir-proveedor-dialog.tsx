import type { Sucursal } from "@/features/branches/types/branches.types"
import { providersApi } from "@/features/providers/api/providersApi"
import { useResourceList } from "@/hooks/useResourceList"
import { CrearOrdenCompraDialog } from "./crear-orden-compra-dialog"

export interface PedidoProveedor {
  varianteId: string
  sucursalId: string
}

interface Props {
  pedido: PedidoProveedor | null
  sucursales: Sucursal[]
  onClose: () => void
  onSuccess: () => void
}

/** "Pedir al proveedor" desde la tabla de stock: la orden nace con la
 * variante y la sucursal de la fila; el proveedor se deduce de su colección.
 * Solo se monta para ADMIN (GET /proveedores es ADMIN). */
export function PedirProveedorDialog({ pedido, sucursales, onClose, onSuccess }: Props) {
  const proveedores = useResourceList(providersApi.getProveedores)
  return (
    <CrearOrdenCompraDialog
      open={Boolean(pedido)}
      onOpenChange={(open) => !open && onClose()}
      proveedores={proveedores.items}
      sucursales={sucursales}
      onSuccess={onSuccess}
      initialVarianteId={pedido?.varianteId}
      initialSucursalId={pedido?.sucursalId}
    />
  )
}
