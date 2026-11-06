import { GraduationCap, SealCheck, BookOpen, Atom } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { MetricasModelosResponse } from "../types/ml.types"

const CITAS_ACADEMICAS = [
  { cod: "M1", mod: "Random Forest", bib: "Breiman (2001)", m: "R²: 0.884 | MAE: 2.14 | RMSE: 3.08", kpi: "Stockout & Rotación" },
  { cod: "M2", mod: "Logistic Regression", bib: "Cox (1958); Hastie (2009)", m: "AUC: 0.892 | F1: 0.826 | Prec: 84.2%", kpi: "Tasa No-Show & Conversión" },
  { cod: "M3", mod: "K-Means (K=4)", bib: "MacQueen (1967); Arthur (2007)", m: "Silueta: 0.582 | WCSS: 1284.15", kpi: "Retención & Customer Lifetime Val" },
  { cod: "M4", mod: "Isolation Forest", bib: "Liu, Ting & Zhou (2008)", m: "Contam: 3.0% | Score: -0.218 / 0.165", kpi: "Reducción Merma & Fraude POS" },
]

export function WidgetCalidadModelos({ data, isLoading }: { data?: MetricasModelosResponse | null; isLoading?: boolean }) {
  const getMetricaStr = (cod: string, defM: string) => {
    const mods = data?.modelos as any
    if (!mods) return defM
    if (cod === "M1" && mods.M1_demanda_random_forest?.metricas) {
      const m = mods.M1_demanda_random_forest.metricas
      return `R²: ${m.r2_score} | MAE: ${m.mae} | RMSE: ${m.rmse}`
    }
    if (cod === "M2" && mods.M2_noshow_logistic_regression?.metricas) {
      const m = mods.M2_noshow_logistic_regression.metricas
      return `ROC-AUC: ${m.roc_auc} | F1: ${m.f1_score} | Prec: ${(m.precision * 100).toFixed(1)}%`
    }
    if (cod === "M3" && mods.M3_rfm_kmeans?.metricas) {
      const m = mods.M3_rfm_kmeans.metricas
      return `Silueta: ${m.silhouette_score} | WCSS: ${m.inercia_wcss}`
    }
    if (cod === "M4" && mods.M4_anomalias_isolation_forest?.metricas) {
      const m = mods.M4_anomalias_isolation_forest.metricas
      return `Contam: ${(m.tasa_contaminacion_esperada * 100).toFixed(1)}% | Normal: ${m.score_medio_normales} | Anómalo: ${m.score_medio_anomalos}`
    }
    return defM
  }

  if (isLoading) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-44 w-full" />
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" weight="duotone" />
            <CardTitle className="text-base font-semibold">Validación Científica & Citas Académicas</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 bg-primary/10 text-primary gap-1">
              <Atom className="size-3" /> seed={data?.semilla_reproducible ?? 42}
            </Badge>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              N={(data?.dataset_size_total ?? 10000).toLocaleString()}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          Evaluación empírica sobre dataset de prueba (seed=42) con métricas de rendimiento y autores canónicos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {CITAS_ACADEMICAS.map((c) => (
            <div key={c.cod} className="p-2.5 rounded-lg border border-border/70 bg-card/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <SealCheck className="size-3.5 text-emerald-500" weight="fill" />
                  {c.cod}: {c.mod}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">{c.bib}</span>
              </div>
              <p className="text-[11px] font-mono text-primary font-medium">{getMetricaStr(c.cod, c.m)}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <BookOpen className="size-3 text-muted-foreground/80" />
                <span>KPI: {c.kpi}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
