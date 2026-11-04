import { ArrowDownRight, Package, Plus } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Sucursal } from "@/features/branches/types/branches.types"
import type { Proveedor } from "@/features/providers/types/providers.types"
import type { OrdenCompra } from "../../types/purchase-orders.types"
import { EstadoOrdenBadge } from "./estado-orden-badge"

interface OrdenesCompraTableProps {
  ordenes: OrdenCompra[]
  proveedores: Proveedor[]
  sucursales: Sucursal[]
  onRecibir: (orden: OrdenCompra) => void
  onNuevaOrden: () => void
}

export function OrdenesCompraTable({
  ordenes,
  proveedores,
  sucursales,
  onRecibir,
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
        <Button onClick={onNuevaOrden} size="sm" className="gap-1.5">
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
          {ordenes.map((orden) => {
            const prov =
              proveedores.find((p) => p.id === orden.proveedorId)?.razonSocial ??
              orden.proveedorId.slice(0, 8)
            const suc =
              sucursales.find((s) => s.id === orden.sucursalDestinoId)?.nombre ??
              orden.sucursalDestinoId.slice(0, 8)
            const pedidas = orden.items.reduce((acc, it) => acc + it.cantidadPedida, 0)
            const recibidas = orden.items.reduce((acc, it) => acc + it.cantidadRecibida, 0)
            const tienePendientes =
              orden.estado !== "CANCELADA" && orden.estado !== "RECIBIDA" && recibidas < pedidas

            return (
              <TableRow key={orden.id}>
                <TableCell className="font-mono text-xs font-medium">
                  #{orden.id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-sm font-medium">{prov}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{suc}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div>{new Date(orden.fechaPedido).toLocaleDateString()}</div>
                  {orden.fechaEsperada && (
                    <div className="text-[11px] text-muted-foreground/80">
                      Esp: {new Date(orden.fechaEsperada).toLocaleDateString()}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center text-xs font-mono">
                  {recibidas} / {pedidas} u.
                </TableCell>
                <TableCell>
                  <EstadoOrdenBadge estado={orden.estado} />
                </TableCell>
                <TableCell className="text-right">
                  {tienePendientes && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRecibir(orden)}
                      className="gap-1.5 text-xs h-8"
                    >
                      <ArrowDownRight className="size-3.5" />
                      Recibir mercadería
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
