import { useState } from "react"
import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { ActividadFeed } from "../components/actividad-feed"
import { DashboardSkeleton, DashboardVacio } from "../components/dashboard/dashboard-estados"
import { GraficoAltas } from "../components/dashboard/grafico-altas"
import { IndicadoresSecundarios } from "../components/dashboard/indicadores-secundarios"
import { KpiStrip } from "../components/dashboard/kpi-strip"
import { MrrPorPlan } from "../components/dashboard/mrr-por-plan"
import { TrialsPorVencer } from "../components/dashboard/trials-por-vencer"
import { ExtenderRapido } from "../components/extender-rapido"
import { useDashboard } from "../hooks/useDashboard"
import type { InquilinoResumenDto } from "../types/plataforma.types"

/** `/plataforma/resumen` — salud del negocio Tiendaria (CU38). Solo agregados. */
export function PlataformaDashboardPage() {
  const { data, isLoading, error, reload } = useDashboard()
  const [extendiendo, setExtendiendo] = useState<InquilinoResumenDto | null>(null)
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cómo va Tiendaria. Son totales: los datos de cada tienda son de su dueña.</p>
        </div>
        <Link to="/plataforma/inquilinos" className={cn(buttonVariants({ variant: "outline" }))}>Ver tiendas</Link>
      </div>
      {isLoading && <DashboardSkeleton />}
      {error && !isLoading && (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{error}</AlertDescription>
          <AlertAction><Button size="sm" variant="outline" onClick={reload} className="gap-1.5"><ArrowClockwise /> Reintentar</Button></AlertAction>
        </Alert>
      )}
      {data && !isLoading && data.tiendas.total === 0 && <DashboardVacio />}
      {data && !isLoading && data.tiendas.total > 0 && (
        <>
          <KpiStrip datos={data} />
          <IndicadoresSecundarios datos={data} />
          <div className="grid gap-8 lg:grid-cols-2">
            <GraficoAltas datos={data.altasPorMes} />
            <MrrPorPlan datos={data.mrrPorPlan} />
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <TrialsPorVencer trials={data.trialsPorVencer} onExtender={setExtendiendo} />
            <section className="space-y-3">
              <h2 className="text-base font-medium">Actividad reciente</h2>
              <ActividadFeed eventos={data.actividad} />
            </section>
          </div>
        </>
      )}
      <ExtenderRapido tienda={extendiendo} onCerrar={() => setExtendiendo(null)} onListo={reload} />
    </div>
  )
}
