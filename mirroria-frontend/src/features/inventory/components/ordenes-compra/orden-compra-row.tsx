import { ArrowDownRight, XCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import type { OrdenCompra } from "../../types/purchase-orders.types"
import { EstadoOrdenBadge } from "./estado-orden-badge"

interface Props {
  orden: OrdenCompra
  proveedorNombre: string
  sucursalNombre: string
  onRecibir: (orden: OrdenCompra) => void
  onCancelar: (orden: OrdenCompra) => void
}

/** `fecha_esperada` es DATE ("YYYY-MM-DD"): `new Date(str)` la toma como
 * medianoche UTC y en Bolivia (UTC-4) mostraba el día anterior. */
function fechaLocal(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString()
}

export function OrdenCompraRow({ orden, proveedorNombre, sucursalNombre, onRecibir, onCancelar }: Props) {
  const pedidas = orden.items.reduce((acc, it) => acc + it.cantidadPedida, 0)
  const recibidas = orden.items.reduce((acc, it) => acc + it.cantidadRecibida, 0)
  const abierta = orden.estado === "PENDIENTE" || orden.estado === "RECIBIDA_PARCIAL"

  return (
    <TableRow>
      <TableCell className="font-mono text-xs font-medium">#{orden.id.slice(0, 8)}</TableCell>
      <TableCell className="text-sm font-medium">{proveedorNombre}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{sucursalNombre}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        <div>{new Date(orden.fechaPedido).toLocaleDateString()}</div>
        {orden.fechaEsperada && (
          <div className="text-[11px] text-muted-foreground/80">Esp: {fechaLocal(orden.fechaEsperada)}</div>
        )}
      </TableCell>
      <TableCell className="text-center text-xs font-mono">{recibidas} / {pedidas} u.</TableCell>
      <TableCell>
        <EstadoOrdenBadge estado={orden.estado} />
      </TableCell>
      <TableCell className="text-right">
        {abierta && (
          <div className="flex justify-end gap-1.5">
            <Button variant="outline" size="sm" onClick={() => onRecibir(orden)} className="gap-1.5 text-xs h-8">
              <ArrowDownRight className="size-3.5" />
              Recibir mercadería
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancelar(orden)}
              className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-destructive"
            >
              <XCircle className="size-3.5" />
              Cancelar
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}
