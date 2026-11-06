import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import type { PeriodoDashboard } from "../types/dashboard.types"
import { useDashboardEjecutivo } from "./useDashboardEjecutivo"
import { useDashboardOperativo } from "./useDashboardOperativo"

export type ModoDashboard = "resumen" | "tienda"

/** `?modo=tienda` abre "Hoy en la tienda"; se acepta el valor viejo `operativo`. */
function leerModo(valor: string | null): ModoDashboard {
  return valor === "tienda" || valor === "operativo" ? "tienda" : "resumen"
}

/** Estado del tablero: pestaña sincronizada con la URL, filtros y los dos orígenes de datos. */
export function useDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const esAdmin = user?.role === "ADMIN"
  const modo: ModoDashboard = esAdmin ? leerModo(searchParams.get("modo")) : "tienda"

  const [periodo, setPeriodo] = useState<PeriodoDashboard>("30d")
  const [fechaInicio, setFechaInicio] = useState<string | undefined>()
  const [fechaFin, setFechaFin] = useState<string | undefined>()
  const [sucursalId, setSucursalId] = useState<string | undefined>()

  const cambiarModo = (nuevo: ModoDashboard) => {
    setSearchParams(
      (prev) => {
        const sig = new URLSearchParams(prev)
        if (nuevo === "tienda") sig.set("modo", "tienda")
        else sig.delete("modo")
        return sig
      },
      { replace: true },
    )
  }

  const ejecutivo = useDashboardEjecutivo({ periodo, fechaInicio, fechaFin, sucursalId, enabled: modo === "resumen" })
  const operativo = useDashboardOperativo({ sucursalId: esAdmin ? sucursalId : undefined, enabled: modo === "tienda" })

  return {
    rol: user?.role,
    esAdmin,
    modo,
    cambiarModo,
    filtros: { periodo, fechaInicio, fechaFin, sucursalId, setPeriodo, setFechaInicio, setFechaFin, setSucursalId },
    ejecutivo,
    operativo,
  }
}
