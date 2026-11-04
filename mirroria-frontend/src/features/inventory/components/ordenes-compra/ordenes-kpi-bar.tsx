import { CheckCircle, Clock, Package, XCircle } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import type { OrdenCompra } from "../../types/purchase-orders.types"

interface Props {
  ordenes: OrdenCompra[]
}

export function OrdenesKpiBar({ ordenes }: Props) {
  const total = ordenes.length
  // Abiertas = todavía esperan mercadería (sus unidades pendientes están en tránsito).
  const abiertas = ordenes.filter((o) => o.estado === "PENDIENTE" || o.estado === "RECIBIDA_PARCIAL").length
  const recibidas = ordenes.filter((o) => o.estado === "RECIBIDA").length
  const canceladas = ordenes.filter((o) => o.estado === "CANCELADA").length

  const kpis = [
    { label: "Total órdenes", valor: total, icon: Package },
    { label: "Abiertas", valor: abiertas, icon: Clock },
    { label: "Recibidas", valor: recibidas, icon: CheckCircle },
    { label: "Canceladas", valor: canceladas, icon: XCircle },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.label} className="border bg-card shadow-xs">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p className="text-xl font-bold font-mono tracking-tight mt-0.5">{kpi.valor}</p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
