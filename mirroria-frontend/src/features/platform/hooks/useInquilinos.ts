import { useRecurso } from "@/hooks/useRecurso"
import { plataformaApi } from "../api/plataformaApi"
import type { FiltrosInquilinos } from "../types/plataforma.types"

/** Listado con filtros del backend (`estado`, `suscripcion`, `q`); se vuelve a pedir al cambiar. */
export function useInquilinos(filtros: FiltrosInquilinos) {
  return useRecurso(() => plataformaApi.inquilinos(filtros), JSON.stringify(filtros))
}
