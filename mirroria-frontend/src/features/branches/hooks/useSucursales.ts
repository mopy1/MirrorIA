import { useEffect, useState } from "react"
import { branchesApi } from "../api/branchesApi"
import type { Sucursal } from "../types/branches.types"

export function useSucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    branchesApi
      .getSucursales()
      .then((data) => {
        if (!cancelado) setSucursales(data)
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar las sucursales")
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return { sucursales, isLoading, error }
}
