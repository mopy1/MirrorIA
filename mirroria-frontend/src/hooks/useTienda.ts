import { useContext } from "react"
import { TenantContext } from "@/context/tenant-context"

/** Tienda que se navega. Fuera de `/t/:slug` devuelve `{ tienda: null, slug: null }`. */
export function useTienda() {
  const ctx = useContext(TenantContext)
  return { tienda: ctx?.tienda ?? null, slug: ctx?.slug ?? null }
}
