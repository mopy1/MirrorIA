import { useRecurso } from "@/hooks/useRecurso"
import { plataformaApi } from "../api/plataformaApi"

export function useResumenPlataforma() {
  return useRecurso(plataformaApi.resumen)
}
