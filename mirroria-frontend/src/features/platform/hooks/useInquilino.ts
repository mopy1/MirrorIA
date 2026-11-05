import { useRecurso } from "@/hooks/useRecurso"
import { plataformaApi } from "../api/plataformaApi"

export function useInquilino(id: string) {
  return useRecurso(() => plataformaApi.inquilino(id), id)
}
