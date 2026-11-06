import { useCallback } from "react"
import { useAnomaliasVentas } from "./useAnomaliasVentas"
import { useDemandaMl } from "./useDemandaMl"
import { useModelosMetricas } from "./useModelosMetricas"
import { useNoShowAgenda } from "./useNoShowAgenda"
import { useRfmSegmentos } from "./useRfmSegmentos"
import { useNombresPrendas } from "./useNombresPrendas"

/** Junta las 4 predicciones + la ficha técnica, con recarga global y aviso de estimación. */
export function usePrediccionesMl({ dias, sucursalId }: { dias: number; sucursalId?: string }) {
  const demanda = useDemandaMl({ dias, sucursalId })
  const noShow = useNoShowAgenda({ sucursalId })
  const rfm = useRfmSegmentos()
  const anomalias = useAnomaliasVentas({ sucursalId })
  const metricas = useModelosMetricas()
  const nombres = useNombresPrendas()

  const { reload: rDemanda } = demanda
  const { reload: rNoShow } = noShow
  const { reload: rRfm } = rfm
  const { reload: rAnomalias } = anomalias
  const { reload: rMetricas } = metricas

  const recargarTodo = useCallback(() => {
    void Promise.all([rDemanda(), rNoShow(), rRfm(), rAnomalias(), rMetricas()])
  }, [rDemanda, rNoShow, rRfm, rAnomalias, rMetricas])

  const cargando = demanda.isLoading || noShow.isLoading || rfm.isLoading || anomalias.isLoading
  const esEstimacion = Boolean(
    demanda.data?.fallback || noShow.data?.fallback || rfm.data?.fallback || anomalias.data?.fallback,
  )

  return { demanda, noShow, rfm, anomalias, metricas, nombres, cargando, esEstimacion, recargarTodo }
}
