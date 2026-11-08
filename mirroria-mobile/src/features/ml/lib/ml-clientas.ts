import type { ClusterRfmTipo, RfmSegmentosResponse } from "../types/ml.types"
import { limpiarNombreClienta } from "./ml-lenguaje"

interface InfoGrupo {
  nombre: string
  significado: string
  queHacer: string
  /** Si hay una herramienta del panel para actuar sobre este grupo. */
  conCupon: boolean
}

export const GRUPOS_CLIENTAS: Record<ClusterRfmTipo, InfoGrupo> = {
  VIPS_LEALES: {
    nombre: "Fieles",
    significado: "Compran seguido, hace poco y gastan más que el resto.",
    queHacer: "Avisales primero de las colecciones nuevas y atendelas en persona.",
    conCupon: false,
  },
  POTENCIALES_NUEVAS: {
    nombre: "Nuevas con potencial",
    significado: "Compraron hace poco por primera o segunda vez.",
    queHacer: "Ofreceles un cupón para su segunda compra en las próximas 2 semanas.",
    conCupon: true,
  },
  EN_RIESGO_DORMIDAS: {
    nombre: "Dejaron de comprar",
    significado: "Antes compraban, pero hace meses que no vuelven.",
    queHacer: "Escribiles con un descuento de regreso y mostrales lo nuevo.",
    conCupon: true,
  },
  OCASIONALES_OUTLET: {
    nombre: "Compran en ofertas",
    significado: "Vienen de vez en cuando, sobre todo en rebajas.",
    queHacer: "Avisales de las liquidaciones de fin de temporada.",
    conCupon: false,
  },
}

export const ORDEN_GRUPOS: ClusterRfmTipo[] = [
  "VIPS_LEALES",
  "POTENCIALES_NUEVAS",
  "EN_RIESGO_DORMIDAS",
  "OCASIONALES_OUTLET",
]

export interface GrupoClientas extends InfoGrupo {
  id: ClusterRfmTipo
  cantidad: number
  /** 0-100, para la barra proporcional. */
  porcentaje: number
  /** Valor estimado promedio por clienta del grupo, en Bs (null si no hay datos). */
  valorPorClientaBs: number | null
  nombres: string[]
}

/** Arma los 4 grupos en orden fijo, con cantidad, peso y valor estimado por clienta. */
export function armarGruposClientas(rfm: RfmSegmentosResponse | null | undefined): GrupoClientas[] {
  const clientas = rfm?.clientas_clasificadas ?? []
  const total = rfm?.total_clientas || clientas.length
  return ORDEN_GRUPOS.map((id) => {
    const delGrupo = clientas.filter((c) => c.segmento === id)
    const cantidad = rfm?.distribucion_clusters?.[id] ?? delGrupo.length
    const valores = delGrupo.map((c) => c.clv_estimado_bs).filter((v) => Number.isFinite(v))
    return {
      id,
      ...GRUPOS_CLIENTAS[id],
      queHacer: delGrupo.find((c) => c.estrategia_sugerida)?.estrategia_sugerida ?? GRUPOS_CLIENTAS[id].queHacer,
      cantidad,
      porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0,
      valorPorClientaBs: valores.length ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) : null,
      nombres: delGrupo.slice(0, 3).map((c) => limpiarNombreClienta(c.cliente_nombre)),
    }
  })
}
