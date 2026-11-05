import { useResourceList } from "@/hooks/useResourceList"
import { saasApi } from "../api/saasApi"

/** Planes activos (`GET /saas/planes`), ya ordenados por `orden` del backend. */
export function usePlanes() {
  const { items, isLoading, error, reload } = useResourceList(saasApi.getPlanes)
  return { planes: items, isLoading, error, reload }
}
