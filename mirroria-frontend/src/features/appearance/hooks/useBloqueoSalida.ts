import { useEffect } from "react"

const MENSAJE = "Tenés cambios sin guardar en la apariencia. ¿Salir igual?"

/**
 * Pide confirmación al salir con cambios sin guardar: cerrar/recargar la
 * pestaña (`beforeunload`) y cualquier link interno (captura del click antes
 * que react-router). `useBlocker` no sirve: la app usa <BrowserRouter>, no un
 * data router (desviación FE1b-6).
 */
export function useBloqueoSalida(activo: boolean) {
  useEffect(() => {
    if (!activo) return
    const antesDeSalir = (e: BeforeUnloadEvent) => e.preventDefault()
    const alClic = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]")
      if (!a || a.getAttribute("target") === "_blank" || e.defaultPrevented) return
      if (!window.confirm(MENSAJE)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener("beforeunload", antesDeSalir)
    document.addEventListener("click", alClic, true)
    return () => {
      window.removeEventListener("beforeunload", antesDeSalir)
      document.removeEventListener("click", alClic, true)
    }
  }, [activo])
}
