import { useResourceList } from "@/hooks/useResourceList"
import { plataformaApi } from "../api/plataformaApi"

export function useCiudadesPlataforma() {
  return useResourceList(plataformaApi.ciudades)
}
