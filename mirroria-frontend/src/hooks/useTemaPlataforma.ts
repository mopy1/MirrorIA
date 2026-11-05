import { useLayoutEffect } from "react"
import { limpiarTema } from "@/lib/tema/aplicar-tema"

/**
 * Superficies de MirrorIA (landing, planes, alta, entrar, /plataforma, Wayra):
 * borra cualquier tema de tienda que haya quedado y sigue el claro/oscuro del
 * sistema. Segunda garantía además de la limpieza del TenantProvider (spec §B.5).
 */
export function useTemaPlataforma() {
  useLayoutEffect(() => {
    limpiarTema()
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)")
    const sincronizar = () => document.documentElement.classList.toggle("dark", Boolean(mq?.matches))
    sincronizar()
    mq?.addEventListener("change", sincronizar)
    return () => {
      mq?.removeEventListener("change", sincronizar)
      document.documentElement.classList.remove("dark")
    }
  }, [])
}
