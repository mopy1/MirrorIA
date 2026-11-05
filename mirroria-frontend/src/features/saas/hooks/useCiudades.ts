import { useResourceList } from "@/hooks/useResourceList"
import { saasApi } from "../api/saasApi"

/** Ciudades globales para la primera sucursal (`GET /sucursales/ciudades`). */
export function useCiudades() {
  const { items, isLoading, error, reload } = useResourceList(saasApi.getCiudades)
  return { ciudades: items, isLoading, error, reload }
}
