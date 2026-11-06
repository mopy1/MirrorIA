import { useEffect } from "react"
import type { useDictado } from "./useDictado"

type DictadoState = ReturnType<typeof useDictado>

/**
 * Atajo de teclado: la barra espaciadora alterna el dictado por voz,
 * a menos que el usuario tenga el foco dentro de un campo de texto.
 */
export function useTecladoDictado(dictado: DictadoState) {
  useEffect(() => {
    if (!dictado.soportado) return

    function enUnCampoDeTexto() {
      const tag = document.activeElement?.tagName
      return tag === "INPUT" || tag === "TEXTAREA"
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat || enUnCampoDeTexto()) return
      e.preventDefault()
      dictado.alternar()
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code !== "Space" || enUnCampoDeTexto()) return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [dictado])
}
