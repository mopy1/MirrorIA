import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import type { FiltrosInquilinos } from "../types/plataforma.types"

const CLAVES = ["estado", "suscripcion", "plan", "q", "orden"] as const

/**
 * Filtros del listado EN LA URL (`?q=&estado=&plan=&orden=`): un link del
 * dashboard abre el listado ya filtrado. La búsqueda espera 300 ms.
 */
export function useFiltrosInquilinos() {
  const [params, setParams] = useSearchParams()
  const filtros = useMemo(() => {
    const f: Record<string, string> = {}
    for (const k of CLAVES) {
      const v = params.get(k)
      if (v) f[k] = v
    }
    return f as FiltrosInquilinos
  }, [params])
  const [busqueda, setBusqueda] = useState(filtros.q ?? "")

  useEffect(() => {
    const t = setTimeout(() => {
      if ((filtros.q ?? "") === busqueda.trim()) return
      setParams((actual) => {
        const p = new URLSearchParams(actual)
        if (busqueda.trim()) p.set("q", busqueda.trim())
        else p.delete("q")
        return p
      }, { replace: true })
    }, 300)
    return () => clearTimeout(t)
  }, [busqueda, filtros.q, setParams])

  function setFiltros(f: FiltrosInquilinos) {
    const p = new URLSearchParams()
    for (const k of CLAVES) {
      const v = k === "q" ? filtros.q : f[k]
      if (v) p.set(k, v)
    }
    setParams(p, { replace: true })
  }

  return {
    filtros,
    busqueda,
    setBusqueda,
    setFiltros,
    hayFiltros: Boolean(filtros.estado || filtros.suscripcion || filtros.plan || filtros.q),
    limpiar: () => {
      setBusqueda("")
      setParams(filtros.orden ? { orden: filtros.orden } : {}, { replace: true })
    },
  }
}
