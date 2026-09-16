import { CalendarBlank, Clock, Storefront } from "@phosphor-icons/react"
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
import type { Reserva } from "@/features/reservations/types/reservations.types"
import { cn } from "cn"
import { EstadoAcciones } from "../estado-acciones"
import { ESTADO_BADGES } from "./reservas-table.data"

interface ReservasTableProps {
  reservas: Reserva[]
  sucursales: Sucursal[]
  onReload: () => void
}

export function ReservasTable({ reservas, sucursales, onReload }: ReservasTableProps) {
  const sucursalNombre = (id: string) =>
    sucursales.find((s) => s.id === id)?.nombre ?? "Sucursal"

  return (
    <Card className="overflow-hidden p-0 border bg-card shadow-xs">
      <CardContent className="p-0">
        <Table className="min-w-[620px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[28%] font-medium">Sucursal</TableHead>
              <TableHead className="w-[24%] font-medium">Fecha y hora prevista</TableHead>
              <TableHead className="w-[14%] font-medium">Prendas</TableHead>
              <TableHead className="w-[16%] font-medium">Estado</TableHead>
              <TableHead className="w-[18%] text-right font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                  No hay reservas registradas para esta sucursal.
                </TableCell>
              </TableRow>
            ) : (
              reservas.map((reserva) => {
                const badge = ESTADO_BADGES[reserva.estado] ?? {
                  label: reserva.estado,
                  classes: "bg-muted text-muted-foreground",
                  icon: Clock,
                }
                const Icon = badge.icon
                return (
                  <TableRow key={reserva.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Storefront className="size-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm text-foreground">
                          {sucursalNombre(reserva.sucursalId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <CalendarBlank className="size-3.5 shrink-0" />
                        <span>
                          {new Date(reserva.fechaHoraPrevista).toLocaleString("es-BO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {reserva.items.reduce((sum, i) => sum + i.cantidad, 0)} prendas
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("gap-1.5 py-0.5 text-xs", badge.classes)}>
                        <Icon className="size-3 shrink-0" />
                        <span>{badge.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <EstadoAcciones
                        reservaId={reserva.id}
                        estadoActual={reserva.estado}
                        onCambiado={onReload}
                      />
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
