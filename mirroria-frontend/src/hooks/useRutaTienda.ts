import { useCallback } from "react"
import { rutaTienda } from "@/lib/rutas-tienda"
import { useTienda } from "./useTienda"

/** `const ruta = useRutaTienda(); ruta("/carrito")` → `/t/<slug>/carrito`. */
export function useRutaTienda() {
  const { slug } = useTienda()
  return useCallback((path: string) => rutaTienda(slug, path), [slug])
}
