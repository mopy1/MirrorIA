import { CheckCircle, Clock, Package, Truck } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import type { OrdenCompra } from "../../types/purchase-orders.types"

interface Props {
  ordenes: OrdenCompra[]
}

export function OrdenesKpiBar({ ordenes }: Props) {
  const total = ordenes.length
  const pendientes = ordenes.filter((o) => o.estado === "PENDIENTE").length
  const enTransito = ordenes.filter((o) => o.estado === "EN_TRANSITO").length
  const recibidas = ordenes.filter(
    (o) => o.estado === "RECIBIDA" || o.estado === "RECIBIDA_PARCIAL"
  ).length

  const kpis = [
    { label: "Total órdenes", valor: total, icon: Package },
    { label: "Pendientes", valor: pendientes, icon: Clock },
    { label: "En tránsito", valor: enTransito, icon: Truck },
    { label: "Recibidas", valor: recibidas, icon: CheckCircle },
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
