import { useEffect, useLayoutEffect, useState } from "react"
import { saasApi } from "@/features/saas/api/saasApi"
import { aplicarTemaTienda, guardarCacheMarca, leerCacheMarca, limpiarTema } from "@/lib/tema/aplicar-tema"
import { EVENTO_MARCA_ACTUALIZADA } from "@/lib/tema/eventos"
import { marcaDe } from "@/lib/tema/marca.constants"
import type { MarcaPublica } from "@/types/marca.types"

/**
 * `/admin/*` se ve con la marca de SU tienda, parcial (spec §B.5): principal,
 * acento y logo; neutros claros, Geist y radio fijo. Primero la caché (sin
 * parpadeo), después `GET /saas/tiendas/<slug>`. Al salir, limpia.
 */
export function useTemaAdmin(slug: string | null) {
  const [marca, setMarca] = useState<MarcaPublica | null>(() => (slug ? leerCacheMarca(slug) : null))
  const [nombre, setNombre] = useState<string | null>(null)

  useLayoutEffect(() => {
    const cache = slug ? leerCacheMarca(slug) : null
    if (cache) aplicarTemaTienda(cache, "admin")
    return limpiarTema
  }, [slug])

  useEffect(() => {
    if (!slug) return
    let cancelado = false
    saasApi
      .resolverTienda(slug)
      .then((t) => {
        if (cancelado) return
        const m = marcaDe(t)
        aplicarTemaTienda(m, "admin")
        guardarCacheMarca(slug, m)
        setMarca(m)
        setNombre(t.nombre)
      })
      .catch(() => undefined) // sin marca el panel sigue con neutros: no bloquea el trabajo
    const alGuardar = (e: Event) => {
      const { marca: m, nombre: n } = (e as CustomEvent<{ marca: MarcaPublica; nombre: string }>).detail
      aplicarTemaTienda(m, "admin")
      guardarCacheMarca(slug, m)
      setMarca(m)
      setNombre(n)
    }
    window.addEventListener(EVENTO_MARCA_ACTUALIZADA, alGuardar)
    return () => {
      cancelado = true
      window.removeEventListener(EVENTO_MARCA_ACTUALIZADA, alGuardar)
    }
  }, [slug])

  return { marca, nombre }
}
