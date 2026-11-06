import { useEffect } from "react"
import type { useDictado } from "./useDictado"

type DictadoState = ReturnType<typeof useDictado>

const CONTROLES = "input, textarea, select, button, a[href], [role='tab'], [role='button'], [contenteditable='true']"

/**
 * Atajo de teclado: la barra espaciadora alterna el dictado por voz,
 * a menos que el foco esté en un campo de texto o en un control que ya usa
 * Espacio (botón, pestaña, link): ahí Espacio tiene que activar ese control.
 */
export function useTecladoDictado(dictado: DictadoState) {
  useEffect(() => {
    if (!dictado.soportado) return

    function enUnCampoDeTexto() {
      const el = document.activeElement
      return el instanceof HTMLElement && el !== document.body && el.matches(CONTROLES)
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
