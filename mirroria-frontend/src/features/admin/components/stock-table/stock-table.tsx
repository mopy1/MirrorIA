import { useEffect, useState } from "react"
import { Storefront } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Sucursal } from "@/features/branches/types/branches.types"
import { useVariantesConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import { inventoryApi } from "@/features/inventory/api/inventoryApi"
import type { InventarioSucursal } from "@/features/inventory/types/inventory.types"
import { StockRow } from "./stock-row"
import { StockSucursalHeader } from "./stock-sucursal-header"

interface StockTableProps {
  sucursales: Sucursal[]
  reloadKey?: number
  /** Solo ADMIN: abre la orden de compra prellenada con esa variante/sucursal. */
  onPedir?: (fila: InventarioSucursal) => void
}

export function StockTable({ sucursales, reloadKey = 0, onPedir }: StockTableProps) {
  const [sucursalId, setSucursalId] = useState("")
  const [filas, setFilas] = useState<InventarioSucursal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { variantes } = useVariantesConProducto()

  useEffect(() => {
    if (!sucursalId) {
      setFilas([])
      return
    }
    let cancelado = false
    setIsLoading(true)
    inventoryApi
      .getDisponibilidad({ sucursalId })
      .then((data) => {
        if (!cancelado) setFilas(data)
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [sucursalId, reloadKey])

  return (
    <div className="space-y-4">
      <StockSucursalHeader sucursales={sucursales} sucursalId={sucursalId} onChange={setSucursalId} />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : sucursalId ? (
        <Card className="overflow-hidden p-0 border bg-card shadow-xs">
          <CardContent className="p-0">
            <Table className={onPedir ? "min-w-[680px]" : "min-w-[540px]"}>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-medium">Producto y Variante</TableHead>
                  <TableHead className="font-medium">Disponible</TableHead>
                  <TableHead className="font-medium">Reservado</TableHead>
                  <TableHead className="font-medium">En tránsito</TableHead>
                  {onPedir && <TableHead className="w-12 text-right font-medium">Pedir</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={onPedir ? 5 : 4} className="h-32 text-center text-sm text-muted-foreground">
                      No hay registros de inventario para esta sucursal.
                    </TableCell>
                  </TableRow>
                ) : (
                  filas.map((fila) => (
                    <StockRow
                      key={fila.id}
                      fila={fila}
                      variante={variantes.find((item) => item.varianteId === fila.varianteId)}
                      onPedir={onPedir}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-dashed p-8 text-center bg-muted/10">
          <Storefront className="size-8 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium text-foreground">Ninguna sucursal seleccionada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Selecciona una sucursal en el menú superior para consultar su disponibilidad.
          </p>
        </Card>
      )}
    </div>
  )
}
