import { Truck } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import type { VarianteConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import type { InventarioSucursal } from "@/features/inventory/types/inventory.types"
import { StockBadge } from "./stock-badge"

/** Mismo umbral que StockBadge para "Bajo". */
const POCO_STOCK_LIBRE = 5

interface Props {
  fila: InventarioSucursal
  variante?: VarianteConProducto
  /** Solo llega para ADMIN (el encargado no gestiona órdenes de compra). */
  onPedir?: (fila: InventarioSucursal) => void
}

export function StockRow({ fila, variante: v, onPedir }: Props) {
  const libre = fila.cantidadDisponible - fila.cantidadReservada
  return (
    <TableRow className="hover:bg-muted/30 transition-colors">
      <TableCell>
        {v ? (
          <div>
            <p className="font-medium text-sm text-foreground">{v.productoTitulo}</p>
            <p className="text-xs text-muted-foreground font-mono">
              Talla {v.tallaNombre} · Color {v.colorNombre}
            </p>
          </div>
        ) : (
          <span className="font-mono text-xs">{fila.varianteId}</span>
        )}
      </TableCell>
      <TableCell>
        <StockBadge cantidad={fila.cantidadDisponible} />
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs text-muted-foreground">{fila.cantidadReservada} u.</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs text-muted-foreground">{fila.cantidadEnTransito} u.</span>
      </TableCell>
      {onPedir && (
        <TableCell className="text-right">
          <Button
            size="icon-sm"
            variant={libre <= POCO_STOCK_LIBRE ? "outline" : "ghost"}
            onClick={() => onPedir(fila)}
            aria-label="Pedir al proveedor"
            title="Pedir al proveedor"
          >
            <Truck className="size-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  )
}
