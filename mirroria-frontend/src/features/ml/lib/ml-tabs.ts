/** Pestañas de Predicciones. Los ids son los valores históricos de `?tab=` (no romper links). */
export type TabPrediccion = "resumen" | "demanda" | "noshow" | "rfm" | "auditoria"

export const TABS_PREDICCION: { id: TabPrediccion; etiqueta: string }[] = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "demanda", etiqueta: "Qué reponer" },
  { id: "noshow", etiqueta: "Citas en riesgo" },
  { id: "rfm", etiqueta: "Tus clientas" },
  { id: "auditoria", etiqueta: "Ventas para revisar" },
]

/** El resumen no lleva parámetro; cualquier valor desconocido (incluido el viejo "overview") cae ahí. */
export function leerTab(param: string | null): TabPrediccion {
  const valida = TABS_PREDICCION.find((t) => t.id === param && t.id !== "resumen")
  return valida ? valida.id : "resumen"
}

export const HORIZONTES = [7, 15, 30, 60] as const
