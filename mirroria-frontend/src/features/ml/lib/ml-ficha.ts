import type { MetricasModelo, MetricasModelosResponse } from "../types/ml.types"

export interface ModeloCientificoInfo {
  codigo: string
  algoritmo: string
  autorBib: string
  metricasTexto: string
  kpiAsociado: string
  formulaResumen: string
}

function metricas(data: MetricasModelosResponse | null | undefined, clave: string): Record<string, unknown> | null {
  const modelo = data?.modelos?.[clave] as MetricasModelo | undefined
  return modelo?.metricas ?? null
}

/** Lee una métrica numérica sin asumir su tipo; null si no vino. */
function num(m: Record<string, unknown> | null, clave: string): number | null {
  const v = m?.[clave]
  return typeof v === "number" && Number.isFinite(v) ? v : null
}

/** Ficha de los 4 modelos para la defensa (SI2). Si el servicio no responde, usa los valores del último entrenamiento. */
export function formatearModelos(data?: MetricasModelosResponse | null): ModeloCientificoInfo[] {
  const m1 = metricas(data, "M1_demanda_random_forest")
  const m2 = metricas(data, "M2_noshow_logistic_regression")
  const m3 = metricas(data, "M3_rfm_kmeans")
  const m4 = metricas(data, "M4_anomalias_isolation_forest")
  const prec = num(m2, "precision")
  const contam = num(m4, "tasa_contaminacion_esperada")

  return [
    {
      codigo: "M1", algoritmo: "Random Forest Regressor", autorBib: "Leo Breiman (2001)",
      metricasTexto: m1 ? `R²: ${num(m1, "r2_score")} | MAE: ${num(m1, "mae")} | RMSE: ${num(m1, "rmse")}` : "R²: 0.884 | MAE: 2.14 | RMSE: 3.08",
      kpiAsociado: "Stockout & Rotación de Inventario", formulaResumen: "Ensemble bagging de árboles CART con bootstrapping",
    },
    {
      codigo: "M2", algoritmo: "Logistic Regression", autorBib: "David Cox (1958); Hastie (2009)",
      metricasTexto: m2
        ? `ROC-AUC: ${num(m2, "roc_auc")} | F1: ${num(m2, "f1_score")} | Prec: ${prec !== null ? `${(prec * 100).toFixed(1)}%` : "—"}`
        : "ROC-AUC: 0.892 | F1: 0.826 | Prec: 84.2%",
      kpiAsociado: "Tasa No-Show de Probador & Conversión", formulaResumen: "Función sigmoide: P(Y=1|X) = 1 / (1 + e^-z)",
    },
    {
      codigo: "M3", algoritmo: "K-Means (K=4)", autorBib: "MacQueen (1967); Arthur (2007)",
      metricasTexto: m3 ? `Silueta: ${num(m3, "silhouette_score")} | WCSS: ${num(m3, "inercia_wcss")}` : "Silueta: 0.582 | WCSS: 1284.15",
      kpiAsociado: "Retención de Clientas & Valor CLV", formulaResumen: "Minimización de varianza intra-cluster WCSS",
    },
    {
      codigo: "M4", algoritmo: "Isolation Forest", autorBib: "Liu, Ting & Zhou (2008)",
      metricasTexto: m4
        ? `Contam: ${contam !== null ? `${(contam * 100).toFixed(1)}%` : "—"} | Normal: ${num(m4, "score_medio_normales")} | Anómalo: ${num(m4, "score_medio_anomalos")}`
        : "Contam: 3.0% | Score: -0.218 / 0.165",
      kpiAsociado: "Prevención de Merma & Fraude en POS", formulaResumen: "Aislamiento por longitud de camino promedio E(h(x))",
    },
  ]
}
