import type { DatosPredicciones } from "../../lib/ml-acciones"

interface IndicadoresTecnicosProps extends DatosPredicciones {
  esEstimacion: boolean
}

/** Los KPIs crudos de cada modelo (los que la vista principal traduce a palabras). */
export function IndicadoresTecnicos({ demanda, noShow, rfm, anomalias, esEstimacion }: IndicadoresTecnicosProps) {
  const filas: [string, string][] = [
    ["Origen", esEstimacion ? "Heurística de respaldo (fallback: el microservicio no respondió)" : "Inferencia en vivo · microservicio FastAPI :8002"],
    ["M1 · Stockout rate proyectado", demanda ? `${demanda.kpis_resumen.quiebre_stock_rate_pct}%` : "—"],
    ["M1 · Rotación proyectada", demanda ? `${demanda.kpis_resumen.rotacion_proyectada}x (horizonte ${demanda.horizonte_dias} d)` : "—"],
    ["M2 · Tasa de No-Show esperada", noShow ? `${noShow.tasa_no_show_esperada_pct}%` : "—"],
    ["M2 · Alertas críticas (p ≥ 0.65)", noShow ? String(noShow.alertas_criticas_count) : "—"],
    ["M3 · Retención estimada (CRR)", rfm ? `${rfm.tasa_retencion_estimada_pct}%` : "—"],
    ["M3 · CLV promedio", rfm ? `Bs ${rfm.clv_promedio_bs.toLocaleString("es-BO")}` : "—"],
    ["M4 · Tasa de anomalías", anomalias ? `${anomalias.tasa_anomalias_pct}% (${anomalias.anomalias_detectadas}/${anomalias.total_analizadas})` : "—"],
  ]

  return (
    <dl className="divide-y divide-border rounded-lg border border-border text-xs">
      {filas.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="font-medium tabular-nums text-foreground sm:text-right">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
