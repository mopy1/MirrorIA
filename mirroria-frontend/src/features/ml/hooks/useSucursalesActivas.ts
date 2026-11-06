import { useEffect, useState } from "react"
import { branchesApi } from "@/features/branches/api/branchesApi"
import type { Sucursal } from "@/features/branches/types/branches.types"

/** Sucursales activas para el filtro. Si falla, el filtro queda en "Todas". */
export function useSucursalesActivas(): Sucursal[] {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

  useEffect(() => {
    let activo = true
    branchesApi
      .getSucursales()
      .then((s) => {
        if (activo) setSucursales(s.filter((x) => x.activo !== false))
      })
      .catch(() => {
        if (activo) setSucursales([])
      })
    return () => {
      activo = false
    }
  }, [])

  return sucursales
}
