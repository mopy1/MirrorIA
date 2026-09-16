import { CheckCircle, Globe, Storefront } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Sucursal } from "@/features/branches/types/branches.types"
import type { Venta } from "@/features/checkout/types/checkout.types"
import { formatMoney } from "@/lib/money"
import { cn } from "cn"
import { ESTADO_VENTA } from "./ventas-table.data"

interface VentasTableProps {
  ventas: Venta[]
  sucursales: Sucursal[]
}

export function VentasTable({ ventas, sucursales }: VentasTableProps) {
  const sucursalNombre = (id: string) => sucursales.find((s) => s.id === id)?.nombre ?? id

  return (
    <Card className="overflow-hidden p-0 border bg-card shadow-xs">
      <CardContent className="p-0">
        <Table className="min-w-[620px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[20%] font-medium">Comprobante</TableHead>
              <TableHead className="w-[24%] font-medium">Sucursal</TableHead>
              <TableHead className="w-[16%] font-medium">Canal</TableHead>
              <TableHead className="w-[16%] font-medium">Estado</TableHead>
              <TableHead className="w-[12%] font-medium">Total</TableHead>
              <TableHead className="w-[12%] text-right font-medium">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                  No se han registrado ventas todavía.
                </TableCell>
              </TableRow>
            ) : (
              ventas.map((venta) => {
                const estado = ESTADO_VENTA[venta.estado] ?? {
                  label: venta.estado,
                  classes: "bg-muted text-muted-foreground",
                  icon: CheckCircle,
                }
                const Icon = estado.icon
                const isOnline = venta.canal.toUpperCase() === "WEB"

                return (
                  <TableRow key={venta.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs font-normal">
                        #{venta.id.slice(0, 8).toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Storefront className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          {sucursalNombre(venta.sucursalId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 text-xs font-normal py-0.5",
                          isOnline
                            ? "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : "border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                        )}
                      >
                        {isOnline ? <Globe className="size-3 shrink-0" /> : <Storefront className="size-3 shrink-0" />}
                        <span>{isOnline ? "Tienda Web" : "Caja Física"}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("gap-1 py-0.5 text-xs", estado.classes)}>
                        <Icon className="size-3 shrink-0" />
                        <span>{estado.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm text-foreground">
                      {formatMoney(venta.totalCents)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground font-mono">
                      {new Date(venta.createdAt).toLocaleDateString("es-BO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
