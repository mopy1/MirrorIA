import { useEffect, useState } from "react"
import type { FiltrosInquilinos } from "../types/plataforma.types"

/** Filtros del listado; la búsqueda de texto espera 400 ms antes de pedirle al backend. */
export function useFiltrosInquilinos() {
  const [filtros, setFiltros] = useState<FiltrosInquilinos>({})
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setFiltros((f) => (f.q === busqueda ? f : { ...f, q: busqueda || undefined })), 400)
    return () => clearTimeout(t)
  }, [busqueda])

  return {
    filtros,
    busqueda,
    setBusqueda,
    setFiltros: (f: FiltrosInquilinos) => setFiltros({ ...f, q: filtros.q }),
    hayFiltros: Boolean(filtros.estado || filtros.suscripcion || filtros.q),
    limpiar: () => {
      setBusqueda("")
      setFiltros({})
    },
  }
}
