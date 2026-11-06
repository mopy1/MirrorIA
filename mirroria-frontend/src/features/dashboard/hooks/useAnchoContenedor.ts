import { useEffect, useRef, useState } from "react"

/**
 * Mide el ancho real de un contenedor con ResizeObserver.
 * Los gráficos de Recharts se dibujan solo cuando el ancho es > 0, con medidas explícitas:
 * así nunca arrancan con width/height -1 (el gráfico vacío de antes).
 */
export function useAnchoContenedor<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [ancho, setAncho] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setAncho(Math.floor(el.getBoundingClientRect().width))
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entrada]) => {
      if (entrada) setAncho(Math.floor(entrada.contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, ancho }
}
