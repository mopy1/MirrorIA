import { TrendUp, CalendarCheck, UsersThree, ShieldWarning } from "@phosphor-icons/react"
import type {
  DemandaMlResponse,
  NoShowAgendaResponse,
  RfmSegmentosResponse,
  AnomaliasVentasResponse,
} from "../types/ml.types"
import { MlKpiCell } from "./ml-kpi-cell"

interface MlKpiRibbonProps {
  demanda?: DemandaMlResponse | null
  noShow?: NoShowAgendaResponse | null
  rfm?: RfmSegmentosResponse | null
  anomalias?: AnomaliasVentasResponse | null
}

/** Franja métrica horizontal continua con los 4 indicadores clave del negocio (Anti-Slop). */
export function MlKpiRibbon({ demanda, noShow, rfm, anomalias }: MlKpiRibbonProps) {
  const quiebrePct = demanda?.kpis_resumen?.quiebre_stock_rate_pct ?? 0
  const rotacion = demanda?.kpis_resumen?.rotacion_proyectada ?? 0
  const noShowPct = noShow?.tasa_no_show_esperada_pct ?? 0
  const alertasCriticas = noShow?.alertas_criticas_count ?? 0
  const retencionPct = rfm?.tasa_retencion_estimada_pct ?? 0
  const clvProm = rfm?.clv_promedio_bs ?? 0
  const anomaliaPct = anomalias?.tasa_anomalias_pct ?? 0
  const montoObs = ((anomalias?.monto_sospechoso_cents ?? 0) / 100).toLocaleString()

  return (
    <div className="grid grid-cols-2 divide-y divide-border/60 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm sm:grid-cols-4 sm:divide-x sm:divide-y-0 shadow-xs">
      <MlKpiCell
        label="Riesgo Quiebre (M1)"
        value={`${quiebrePct}%`}
        context={`Rotación: ${rotacion}x`}
        icon={TrendUp}
        trend={quiebrePct > 15 ? "negative" : "positive"}
      />
      <MlKpiCell
        label="No-Show Probador (M2)"
        value={`${noShowPct}%`}
        context={`${alertasCriticas} críticas hoy`}
        icon={CalendarCheck}
        trend={alertasCriticas > 0 ? "warning" : "positive"}
      />
      <MlKpiCell
        label="Retención Clientas (M3)"
        value={`${retencionPct}%`}
        context={`CLV: Bs ${clvProm.toLocaleString()}`}
        icon={UsersThree}
        trend="positive"
      />
      <MlKpiCell
        label="Ventas Atípicas POS (M4)"
        value={`${anomaliaPct}%`}
        context={`Bs ${montoObs} en obs.`}
        icon={ShieldWarning}
        trend={anomaliaPct > 5 ? "negative" : "neutral"}
      />
    </div>
  )
}
