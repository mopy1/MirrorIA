import { useRecurso } from "@/hooks/useRecurso"
import { saasApi } from "../api/saasApi"

/** Cifras reales de la plataforma (`GET /saas/estadisticas`, caché de 5 min en el backend). */
export function useEstadisticas() {
  return useRecurso(saasApi.getEstadisticas)
}
