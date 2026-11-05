import { useResourceList } from "@/hooks/useResourceList"
import { saasApi } from "../api/saasApi"

const cargar = () => saasApi.getTiendas(12)

/** Directorio de la landing (`GET /saas/tiendas?limite=12`). */
export function useTiendasDirectorio() {
  const { items, isLoading, error, reload } = useResourceList(cargar)
  return { tiendas: items, isLoading, error, reload }
}
