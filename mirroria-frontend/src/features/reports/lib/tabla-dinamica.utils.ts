import type { FilaReporte, Variacion } from "../types/reports.types"

export type ColumnaOrden = "etiqueta" | "valor" | "anterior" | "variacion"
export type DireccionOrden = "asc" | "desc"

const normalizar = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

/** Búsqueda sin importar mayúsculas ni tildes; `etiquetar` permite buscar sobre la etiqueta que se ve ("5 oct"). */
export function filtrarFilas(
  filas: FilaReporte[],
  busqueda: string,
  etiquetar: (etiqueta: string) => string = (e) => e,
): FilaReporte[] {
  const q = normalizar(busqueda)
  if (!q) return filas
  return filas.filter((f) => normalizar(etiquetar(f.etiqueta)).includes(q) || normalizar(f.etiqueta).includes(q))
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

/** Color semántico de una variación porcentual (el signo y el número siempre van en texto). */
export function claseVariacion(delta: number | null | undefined): string {
  if (delta == null || delta === 0) return "text-muted-foreground"
  return delta > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
}
