import { useEffect, useState } from "react"
import { Storefront } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { StockBadge } from "./stock-badge"

interface StockTableProps {
  sucursales: Sucursal[]
  reloadKey?: number
}

export function StockTable({ sucursales, reloadKey = 0 }: StockTableProps) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          Stock por sucursal
        </h2>
        <div className="w-full sm:w-60">
          <Select value={sucursalId} onValueChange={(v) => setSucursalId(v as string)}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Elegí una sucursal">
                {(id: string) => sucursales.find((s) => s.id === id)?.nombre ?? "Elegí una sucursal"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sucursales.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nombre} ({s.ciudadNombre})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : sucursalId ? (
        <Card className="overflow-hidden p-0 border bg-card shadow-xs">
          <CardContent className="p-0">
            <Table className="min-w-[540px]">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[45%] font-medium">Producto y Variante</TableHead>
                  <TableHead className="w-[20%] font-medium">Disponible</TableHead>
                  <TableHead className="w-[18%] font-medium">Reservado</TableHead>
                  <TableHead className="w-[17%] font-medium">En tránsito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                      No hay registros de inventario para esta sucursal.
                    </TableCell>
                  </TableRow>
                ) : (
                  filas.map((fila) => {
                    const v = variantes.find((item) => item.varianteId === fila.varianteId)
                    return (
                      <TableRow key={fila.id} className="hover:bg-muted/30 transition-colors">
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
                      </TableRow>
                    )
                  })
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
