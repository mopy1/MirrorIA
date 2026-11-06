import type { ReactNode } from "react"
import { ArrowsClockwise, Storefront } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { DashboardOperativoDto } from "../../types/dashboard.types"
import { AccesosDirectosPos } from "./accesos-directos-pos"
import { KpiGridOperativo } from "./kpi-grid-operativo"
import { WidgetAlertasStock } from "./widget-alertas-stock"
import { WidgetReservasHoy } from "./widget-reservas-hoy"
import { cn } from "cn"

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
        <div className="flex items-center gap-2">
          {sucursalSelector}
          {onRecargar && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRecargar}
              disabled={isLoading}
              className="h-7 gap-1.5 px-2.5 text-xs font-medium shadow-xs"
              title="Actualizar turno"
            >
              <ArrowsClockwise className={cn("size-3.5", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          )}
        </div>
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
