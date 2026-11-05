import { useRecurso } from "@/hooks/useRecurso"
import { aparienciaApi } from "../api/aparienciaApi"

/** `GET /saas/mi-marca` (ADMIN; funciona con la tienda vencida). */
export function useMiMarca() {
  return useRecurso(aparienciaApi.getMiMarca)
}
