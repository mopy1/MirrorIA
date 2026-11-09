import { formatMoney } from "../../../lib/money"
import type { DatosPredicciones } from "./ml-acciones"
import { seAgota } from "./ml-demanda"
import { vendraCita, type Tono } from "./ml-lenguaje"
import type { TabPrediccion } from "./ml-tabs"

export interface KpiPrediccion {
  id: string
  tab: TabPrediccion
  titulo: string
  /** Explicación corta para el "?" del término. */
  ayuda: string
  valor: string
  /** "¿Comparado con qué?" en una frase. */
  detalle: string
  tono: Tono
}

const SIN_DATO = "—"

/** Los 4 números de arriba, en el mismo lenguaje que el resto de la pantalla. */
export function armarKpis({ demanda, noShow, rfm, anomalias }: DatosPredicciones): KpiPrediccion[] {
  const prendas = demanda?.predicciones ?? []
  const agotan = prendas.filter(seAgota).length
  const citas = noShow?.evaluaciones ?? []
  const fallan = citas.filter((c) => vendraCita(c.probabilidad_no_show).enRiesgo).length
  const totalClientas = rfm?.total_clientas ?? 0
  const siguen = totalClientas - (rfm?.distribucion_clusters?.EN_RIESGO_DORMIDAS ?? 0)
  const raras = anomalias?.anomalias_detectadas ?? 0
  const horizonte = demanda?.horizonte_dias ?? 30

  return [
    {
      id: "agotan", tab: "demanda", titulo: "Prendas que se pueden agotar",
      ayuda: `Prendas cuyo stock no alcanzaría para lo que se espera vender en los próximos ${horizonte} días.`,
      valor: demanda ? String(agotan) : SIN_DATO,
      detalle: demanda ? `de ${prendas.length} prendas, en los próximos ${horizonte} días` : "Sin datos por ahora",
      tono: agotan > 0 ? "alerta" : "bien",
    },
    {
      id: "fallan", tab: "noshow", titulo: "Citas que pueden fallar",
      ayuda: "Citas al probador de hoy en las que la clienta podría no venir, según cómo y cuándo reservó.",
      valor: noShow ? String(fallan) : SIN_DATO,
      detalle: noShow ? `de ${citas.length} citas de hoy` : "Sin datos por ahora",
      tono: fallan > 0 ? "atencion" : "bien",
    },
    {
      id: "siguen", tab: "rfm", titulo: "Clientas que siguen comprando",
      ayuda: "Clientas que no dejaron de comprar: fieles, nuevas y las que vienen en ofertas.",
      valor: rfm ? String(Math.max(0, siguen)) : SIN_DATO,
      detalle: rfm ? `de ${totalClientas} clientas con compras` : "Sin datos por ahora",
      // Que alguna clienta se enfríe es normal: solo es "atención" si se perdió la mitad o más.
      tono: rfm && totalClientas > 0 && siguen / totalClientas < 0.5 ? "atencion" : "bien",
    },
    {
      id: "raras", tab: "auditoria", titulo: "Ventas inusuales",
      ayuda: "Ventas que no se parecen a las de siempre: descuentos muy altos, horarios raros o montos fuera de lo común.",
      valor: anomalias ? String(raras) : SIN_DATO,
      detalle: anomalias
        ? raras > 0
          ? `${formatMoney(anomalias.monto_sospechoso_cents)} en ${anomalias.total_analizadas} ventas recientes`
          : `de ${anomalias.total_analizadas} ventas recientes`
        : "Sin datos por ahora",
      tono: raras > 0 ? "alerta" : "bien",
    },
  ]
}
