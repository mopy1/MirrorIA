import type { ReactNode } from "react"
import { Storefront } from "@phosphor-icons/react"
import type { DashboardOperativoDto } from "../../types/dashboard.types"
import { AccesosDirectosPos } from "./accesos-directos-pos"
import { KpiGridOperativo } from "./kpi-grid-operativo"
import { WidgetAlertasStock } from "./widget-alertas-stock"
import { WidgetReservasHoy } from "./widget-reservas-hoy"

interface DashboardOperativoViewProps {
  data?: DashboardOperativoDto | null
  isLoading?: boolean
  onRecargar?: () => void
  sucursalSelector?: ReactNode
}

export function DashboardOperativoView({
  data,
  isLoading,
  onRecargar,
  sucursalSelector,
}: DashboardOperativoViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground font-heading">
              Punto de Venta — Turno de Hoy
            </h1>
            {data?.sucursal && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium rounded-md bg-muted px-2 py-0.5">
                <Storefront className="size-3 text-primary" />
                {data.sucursal.nombre} ({data.sucursal.ciudad})
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Métricas de caja en vivo, clientas con cita para probarse y stock crítico de mostrador.
          </p>
        </div>
        {sucursalSelector}
      </div>

      <AccesosDirectosPos />

      <KpiGridOperativo kpis={data?.kpisHoy} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WidgetReservasHoy
          reservas={data?.reservasHoy}
          onActualizado={onRecargar}
          isLoading={isLoading}
        />
        <WidgetAlertasStock alertas={data?.alertasStock} isLoading={isLoading} />
      </div>
    </div>
  )
}
