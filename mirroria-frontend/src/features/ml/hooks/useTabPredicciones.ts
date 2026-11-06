import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { leerTab, type TabPrediccion } from "../lib/ml-tabs"

/** Pestaña activa sincronizada con `?tab=` (el resumen no lleva parámetro). */
export function useTabPredicciones(): [TabPrediccion, (tab: TabPrediccion) => void] {
  const [params, setParams] = useSearchParams()
  const tab = leerTab(params.get("tab"))

  const cambiar = useCallback(
    (nueva: TabPrediccion) => {
      setParams(
        (prev) => {
          const siguiente = new URLSearchParams(prev)
          if (nueva === "resumen") siguiente.delete("tab")
          else siguiente.set("tab", nueva)
          return siguiente
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return [tab, cambiar]
}
