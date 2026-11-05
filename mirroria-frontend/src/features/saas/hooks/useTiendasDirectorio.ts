import { useMemo } from "react"
import { useResourceList } from "@/hooks/useResourceList"
import { SLUG_DEMO } from "@/lib/rutas-tienda"
import { saasApi } from "../api/saasApi"

const cargar = () => saasApi.getTiendas(12)

/** Directorio de la landing (`GET /saas/tiendas?limite=12`): MirrorIA primero (es la demo). */
export function useTiendasDirectorio() {
  const { items, isLoading, error, reload } = useResourceList(cargar)
  const tiendas = useMemo(() => [...items].sort((a, b) => Number(b.slug === SLUG_DEMO) - Number(a.slug === SLUG_DEMO)), [items])
  return { tiendas, isLoading, error, reload }
}
