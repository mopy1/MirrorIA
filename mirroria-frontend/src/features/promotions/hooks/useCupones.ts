import { useCallback, useState } from "react"
import { useResourceList } from "@/hooks/useResourceList"
import { ApiError } from "@/lib/api"
import { promotionsApi } from "../api/promotionsApi"
import type { CreateCuponDto, Cupon } from "../types/promotions.types"

export function useCupones() {
  const fetcher = useCallback(() => promotionsApi.getCupones(), [])
  const { items: cupones, isLoading, error, reload } = useResourceList<Cupon>(fetcher)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function crearCupon(dto: CreateCuponDto): Promise<boolean> {
    setActionLoading(true)
    setActionError(null)
    try {
      await promotionsApi.createCupon(dto)
      reload()
      return true
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Error al crear el cupón")
      return false
    } finally {
      setActionLoading(false)
    }
  }

  async function toggleEstado(id: string): Promise<boolean> {
    setActionLoading(true)
    setActionError(null)
    try {
      await promotionsApi.toggleCuponEstado(id)
      reload()
      return true
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Error al cambiar estado")
      return false
    } finally {
      setActionLoading(false)
    }
  }

  return {
    cupones,
    isLoading,
    error,
    actionLoading,
    actionError,
    reload,
    crearCupon,
    toggleEstado,
  }
}
