import {
  CheckCircle,
  Clock,
  Percent,
  Tag,
  Ticket,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Cupon } from "@/features/promotions/types/promotions.types"
import { formatMoney } from "@/lib/money"
import { cn } from "cn"

interface CuponesTableProps {
  cupones: Cupon[]
  isLoading: boolean
  onToggleEstado: (id: string) => void
  actionLoading?: boolean
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function getEstadoCupon(cupon: Cupon) {
  const ahora = new Date()
  const fechaFin = new Date(cupon.fechaFin)

  if (!cupon.activo) {
    return {
      label: "Inactivo",
      variant: "secondary" as const,
      icon: XCircle,
      classes: "bg-muted text-muted-foreground border-border",
    }
  }

  if (ahora > fechaFin) {
    return {
      label: "Expirado",
      variant: "outline" as const,
      icon: Clock,
      classes: "bg-destructive/10 text-destructive border-destructive/25",
    }
  }

  if (cupon.usosMaximos !== null && cupon.usosActuales >= cupon.usosMaximos) {
    return {
      label: "Agotado",
      variant: "outline" as const,
      icon: WarningCircle,
      classes: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    }
  }

  return {
    label: "Activo",
    variant: "outline" as const,
    icon: CheckCircle,
    classes: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  }
}

export function CuponesTable({
  cupones,
  isLoading,
  onToggleEstado,
  actionLoading,
}: CuponesTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (cupones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
          <Ticket className="size-7" />
        </div>
        <h3 className="mt-4 font-semibold text-foreground text-base">No hay cupones registrados</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Crea cupones de descuento porcentuales o de monto fijo para campañas y promociones de la tienda.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px]">Código</TableHead>
            <TableHead>Descuento</TableHead>
            <TableHead>Vigencia</TableHead>
            <TableHead>Uso / Límite</TableHead>
            <TableHead>Monto Mínimo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cupones.map((cupon) => {
            const estado = getEstadoCupon(cupon)
            const EstadoIcon = estado.icon

            return (
              <TableRow key={cupon.id} className="group transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Tag className="size-3.5" />
                    </div>
                    <span className="font-mono text-sm tracking-wider font-semibold text-foreground uppercase">
                      {cupon.codigo}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {cupon.tipoDescuento === "PORCENTAJE" ? (
                      <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20 font-semibold">
                        <Percent className="size-3" />
                        <span>{cupon.valor}% OFF</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 bg-secondary text-secondary-foreground font-semibold">
                        <span>-{formatMoney(cupon.valor)}</span>
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex flex-col gap-0.5">
                    <span>Del {formatDate(cupon.fechaInicio)}</span>
                    <span className="font-medium text-foreground">Al {formatDate(cupon.fechaFin)}</span>
                  </div>
                </TableCell>

                <TableCell className="text-sm">
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="font-semibold text-foreground">{cupon.usosActuales}</span>
                    <span className="text-muted-foreground">
                      / {cupon.usosMaximos !== null ? cupon.usosMaximos : "∞"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-xs">
                  {cupon.montoMinimoCents ? (
                    <span className="font-mono text-foreground font-medium">
                      Min. {formatMoney(cupon.montoMinimoCents)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Sin mínimo</span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className={cn("gap-1 text-xs py-0.5 px-2 font-medium", estado.classes)}>
                    <EstadoIcon className="size-3.5 shrink-0" />
                    <span>{estado.label}</span>
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant={cupon.activo ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 text-xs font-normal"
                    disabled={actionLoading}
                    onClick={() => onToggleEstado(cupon.id)}
                  >
                    {cupon.activo ? "Desactivar" : "Activar"}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
