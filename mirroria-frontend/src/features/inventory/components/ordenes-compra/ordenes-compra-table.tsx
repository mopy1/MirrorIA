import { Package, Plus } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Sucursal } from "@/features/branches/types/branches.types"
import type { Proveedor } from "@/features/providers/types/providers.types"
import type { OrdenCompra } from "../../types/purchase-orders.types"
import { OrdenCompraRow } from "./orden-compra-row"

interface OrdenesCompraTableProps {
  ordenes: OrdenCompra[]
  proveedores: Proveedor[]
  sucursales: Sucursal[]
  onRecibir: (orden: OrdenCompra) => void
  onCancelar: (orden: OrdenCompra) => void
  onNuevaOrden: () => void
}

export function OrdenesCompraTable({
  ordenes,
  proveedores,
  sucursales,
  onRecibir,
  onCancelar,
  onNuevaOrden,
}: OrdenesCompraTableProps) {
  if (ordenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg text-center bg-card">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
          <Package className="size-6" />
        </div>
        <h3 className="text-sm font-semibold">Sin órdenes de compra</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-4">
          No hay órdenes de compra registradas con proveedores aún.
        </p>
        <Button onClick={onNuevaOrden} size="sm" variant="outline" className="gap-1.5">
          <Plus className="size-4" />
          Nueva orden de compra
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">#ID</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Sucursal destino</TableHead>
            <TableHead>Fecha pedido / esperada</TableHead>
            <TableHead className="text-center">Unidades</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenes.map((orden) => (
            <OrdenCompraRow
              key={orden.id}
              orden={orden}
              proveedorNombre={
                proveedores.find((p) => p.id === orden.proveedorId)?.razonSocial ?? orden.proveedorId.slice(0, 8)
              }
              sucursalNombre={
                sucursales.find((s) => s.id === orden.sucursalDestinoId)?.nombre ?? orden.sucursalDestinoId.slice(0, 8)
              }
              onRecibir={onRecibir}
              onCancelar={onCancelar}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
