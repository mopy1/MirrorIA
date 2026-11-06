import type {
  AnomaliasVentasResponse,
  DemandaMlResponse,
  NoShowAgendaResponse,
  RfmSegmentosResponse,
} from "../types/ml.types"
import { formatearNombrePrenda } from "./ml.utils"
import { seAgota, ordenarPorUrgencia } from "./ml-demanda"
import { contar, vendraCita, type Tono } from "./ml-lenguaje"
import type { TabPrediccion } from "./ml-tabs"

export interface DatosPredicciones {
  demanda?: DemandaMlResponse | null
  noShow?: NoShowAgendaResponse | null
  rfm?: RfmSegmentosResponse | null
  anomalias?: AnomaliasVentasResponse | null
  /** id de producto → nombre del catálogo. */
  nombres?: Record<string, string>
}

export interface AccionSemana {
  id: "reponer" | "citas" | "clientas" | "ventas"
  tab: TabPrediccion
  tono: Tono
  /** Verbo + cantidad: "Reponer 4 prendas antes de que se agoten". */
  titulo: string
  detalle: string
  boton: string
  /** Menor = más urgente. */
  prioridad: number
}

function accionReponer({ demanda, nombres = {} }: DatosPredicciones): AccionSemana | null {
  const enRiesgo = ordenarPorUrgencia((demanda?.predicciones ?? []).filter(seAgota))
  if (enRiesgo.length === 0) return null
  const critica = enRiesgo.some((p) => p.riesgo_quiebre === "CRITICO")
  const unidades = enRiesgo.reduce((acc, p) => acc + p.reabastecimiento_sugerido, 0)
  const primeras = enRiesgo.slice(0, 2).map((p) => formatearNombrePrenda(p.producto_id, nombres[p.producto_id] ?? p.nombre))
  const resto = enRiesgo.length > 2 ? ` y ${enRiesgo.length - 2} más` : ""
  return {
    id: "reponer", tab: "demanda", tono: critica ? "critico" : "alerta", prioridad: critica ? 1 : 3,
    titulo: `Reponer ${contar(enRiesgo.length, "prenda", "prendas")} antes de que se agoten`,
    detalle: `${primeras.join(", ")}${resto}. ${unidades > 0 ? `Conviene pedir ${contar(unidades, "unidad", "unidades")} en total.` : ""}`.trim(),
    boton: "Ver qué reponer",
  }
}

function accionCitas({ noShow }: DatosPredicciones): AccionSemana | null {
  const enRiesgo = (noShow?.evaluaciones ?? []).filter((e) => vendraCita(e.probabilidad_no_show).enRiesgo)
  if (enRiesgo.length === 0) return null
  const graves = enRiesgo.filter((e) => vendraCita(e.probabilidad_no_show).tono === "critico").length
  return {
    id: "citas", tab: "noshow", tono: graves > 0 ? "critico" : "atencion", prioridad: graves > 0 ? 2 : 4,
    titulo: `Confirmar ${contar(enRiesgo.length, "cita", "citas")} con riesgo de no venir`,
    detalle: graves > 0
      ? `${contar(graves, "clienta probablemente falte", "clientas probablemente falten")} si no le${graves === 1 ? "" : "s"} escribís hoy.`
      : "Un mensaje de confirmación suele bastar.",
    boton: "Ver citas",
  }
}

function accionClientas({ rfm }: DatosPredicciones): AccionSemana | null {
  const dormidas = rfm?.distribucion_clusters?.EN_RIESGO_DORMIDAS ?? 0
  if (dormidas === 0) return null
  return {
    id: "clientas", tab: "rfm", tono: "atencion", prioridad: 5,
    titulo: `Recuperar ${contar(dormidas, "clienta que dejó de comprar", "clientas que dejaron de comprar")}`,
    detalle: "Hace meses que no vuelven; un descuento de regreso puede traerlas.",
    boton: "Ver clientas",
  }
}

function accionVentas({ anomalias }: DatosPredicciones): AccionSemana | null {
  const raras = (anomalias?.diagnosticos ?? []).filter((d) => d.es_anomalo)
  const n = raras.length || (anomalias?.anomalias_detectadas ?? 0)
  if (n === 0) return null
  const grave = raras.some((d) => d.nivel_riesgo === "CRITICO")
  return {
    id: "ventas", tab: "auditoria", tono: grave ? "alerta" : "atencion", prioridad: grave ? 2.5 : 4.5,
    titulo: `Revisar ${contar(n, "venta inusual", "ventas inusuales")}`,
    detalle: "Descuentos muy altos o ventas a deshora: confirmá con caja que estén bien.",
    boton: "Ver ventas",
  }
}

/** Hasta 4 acciones priorizadas para esta semana, armadas desde las 4 predicciones. */
export function armarAccionesSemana(datos: DatosPredicciones): AccionSemana[] {
  return [accionReponer(datos), accionCitas(datos), accionClientas(datos), accionVentas(datos)]
    .filter((a): a is AccionSemana => a !== null)
    .sort((a, b) => a.prioridad - b.prioridad)
    .slice(0, 4)
}

/** La conclusión en una frase, antes del detalle. */
export function fraseSemana(acciones: AccionSemana[]): string {
  if (acciones.length === 0) {
    return "Todo en orden: no vemos prendas por agotarse, citas en riesgo ni ventas raras."
  }
  const primera = acciones[0].titulo.charAt(0).toLowerCase() + acciones[0].titulo.slice(1)
  if (acciones.length === 1) return `Esta semana hay una sola cosa que atender: ${primera}.`
  return `Esta semana hay ${acciones.length} cosas que atender. Lo más urgente: ${primera}.`
}
