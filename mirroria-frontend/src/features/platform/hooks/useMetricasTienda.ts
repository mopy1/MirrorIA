import { useRecurso } from "@/hooks/useRecurso"
import { plataformaApi } from "../api/plataformaApi"

/** Agregados de UNA tienda (nunca filas): `GET …/inquilinos/:id/metricas`. */
export function useMetricasTienda(id: string) {
  return useRecurso(() => plataformaApi.metricas(id), id)
}
