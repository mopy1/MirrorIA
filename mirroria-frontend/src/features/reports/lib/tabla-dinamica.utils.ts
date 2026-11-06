import type { FilaReporte, Variacion } from "../types/reports.types"

export type ColumnaOrden = "etiqueta" | "valor" | "anterior" | "variacion"
export type DireccionOrden = "asc" | "desc"

export function filtrarFilas(filas: FilaReporte[], busqueda: string): FilaReporte[] {
  if (!busqueda.trim()) return filas
  const q = busqueda.toLowerCase().trim()
  return filas.filter((f) => f.etiqueta.toLowerCase().includes(q))
}

export function ordenarFilas(
  filas: FilaReporte[],
  columna: ColumnaOrden,
  direccion: DireccionOrden,
  variaciones?: Variacion[]
): FilaReporte[] {
  const lista = [...filas]

  lista.sort((a, b) => {
    let valA: number | string = a.valor
    let valB: number | string = b.valor

    if (columna === "etiqueta") {
      valA = a.etiqueta.toLowerCase()
      valB = b.etiqueta.toLowerCase()
      const cmp = valA.localeCompare(valB)
      return direccion === "asc" ? cmp : -cmp
    }

    if (columna === "anterior" && variaciones) {
      valA = variaciones.find((v) => v.clave === a.clave)?.anterior ?? 0
      valB = variaciones.find((v) => v.clave === b.clave)?.anterior ?? 0
    } else if (columna === "variacion" && variaciones) {
      valA = variaciones.find((v) => v.clave === a.clave)?.deltaPorcentual ?? -999999
      valB = variaciones.find((v) => v.clave === b.clave)?.deltaPorcentual ?? -999999
    }

    if (Number(valA) < Number(valB)) return direccion === "asc" ? -1 : 1
    if (Number(valA) > Number(valB)) return direccion === "asc" ? 1 : -1
    return 0
  })

  return lista
}
