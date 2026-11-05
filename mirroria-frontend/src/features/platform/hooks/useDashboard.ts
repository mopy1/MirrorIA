import { useRecurso } from "@/hooks/useRecurso"
import { plataformaApi } from "../api/plataformaApi"

/** `GET /saas/plataforma/dashboard` (KPIs, series, pruebas por vencer y actividad). */
export function useDashboard() {
  return useRecurso(plataformaApi.dashboard)
}
