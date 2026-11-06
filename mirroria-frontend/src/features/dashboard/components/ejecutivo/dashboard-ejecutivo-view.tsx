import type { DashboardEjecutivoDto, PeriodoDashboard } from "../../types/dashboard.types"
import { FiltrosDashboardEjecutivo } from "./filtros-dashboard-ejecutivo"
import { GraficoDistribucionPagos } from "./grafico-distribucion-pagos"
import { GraficoTendenciaIngresos } from "./grafico-tendencia-ingresos"
import { GraficoTopPrendas } from "./grafico-top-prendas"
import { GraficoTopProveedores } from "./grafico-top-proveedores"
import { KpiGridEjecutivo } from "./kpi-grid-ejecutivo"
import { WidgetLimitesPlan } from "./widget-limites-plan"

interface DashboardEjecutivoViewProps {
  periodo: PeriodoDashboard
  sucursalId?: string
  onPeriodoChange: (p: PeriodoDashboard) => void
  onSucursalChange: (s?: string) => void
  data?: DashboardEjecutivoDto | null
  isLoading?: boolean
}

export function DashboardEjecutivoView({
  periodo,
  sucursalId,
  onPeriodoChange,
  onSucursalChange,
  data,
  isLoading,
}: DashboardEjecutivoViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-heading">
            Dashboard Ejecutivo BI
          </h1>
          <p className="text-xs text-muted-foreground">
            Rendimiento comercial, rotación de percha y salud financiera en tiempo real.
          </p>
        </div>
        <FiltrosDashboardEjecutivo
          periodo={periodo}
          sucursalId={sucursalId}
          onPeriodoChange={onPeriodoChange}
          onSucursalChange={onSucursalChange}
        />
      </div>

      <KpiGridEjecutivo kpis={data?.kpis} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GraficoTendenciaIngresos data={data?.graficos.tendenciaIngresos} isLoading={isLoading} />
        </div>
        <div>
          <GraficoDistribucionPagos data={data?.graficos.distribucionPagos} isLoading={isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GraficoTopPrendas prendas={data?.graficos.topPrendas} isLoading={isLoading} />
        <GraficoTopProveedores proveedores={data?.graficos.topProveedores} isLoading={isLoading} />
      </div>

      <WidgetLimitesPlan planSaaS={data?.planSaaS} isLoading={isLoading} />
    </div>
  )
}
