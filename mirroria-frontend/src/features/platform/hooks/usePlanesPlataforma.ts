import { useResourceList } from "@/hooks/useResourceList"
import { plataformaApi } from "../api/plataformaApi"

/** Todos los planes, incluidos los inactivos. */
export function usePlanesPlataforma() {
  return useResourceList(plataformaApi.planes)
}
