import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useMatch, useParams } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { NotFoundPage } from "@/features/errors/pages/NotFoundPage"
import { saasApi } from "@/features/saas/api/saasApi"
import { TiendaNoDisponiblePage } from "@/features/saas/pages/TiendaNoDisponiblePage"
import { ApiError } from "@/lib/api"
import {
  aplicarTemaTienda, guardarCacheMarca, leerCacheMarca, limpiarTema, prepararNeutrosTienda,
} from "@/lib/tema/aplicar-tema"
import { cargarFuente } from "@/lib/tema/fuentes"
import { marcaDe } from "@/lib/tema/marca.constants"
import { getTiendaActiva, setTiendaActiva } from "@/lib/tienda-activa"
import type { TiendaPublica } from "@/types/tienda.types"
import { cn } from "cn"
import { CargandoTienda } from "./cargando-tienda"
import { TenantContext, type TenantContextValue } from "./tenant-context"

type Estado = { tipo: "cargando" } | { tipo: "no-existe" } | { tipo: "error"; mensaje: string } | { tipo: "ok"; tienda: TiendaPublica }

/**
 * Resuelve `/t/:slug` (`GET /saas/tiendas/:slug`), aplica SU marca en <html>
 * sin parpadeo (spec Fase 1b §B.4) y publica la tienda en contexto. Fija la
 * tienda activa EN EL RENDER (idempotente) para que el primer fetch de los
 * hijos ya lleve `X-Tenant`. Al desmontarse limpia tienda y tema.
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const { slug = "" } = useParams()
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" })
  // El staff de una tienda suspendida/vencida tiene que poder entrar a su panel.
  const enLogin = useMatch("/t/:slug/login") !== null
  setTiendaActiva(slug)

  // Antes del primer paint: neutros de tienda y, si hay, la marca de la visita anterior.
  useLayoutEffect(() => {
    setTiendaActiva(slug)
    prepararNeutrosTienda()
    const cache = leerCacheMarca(slug)
    if (cache) aplicarTemaTienda(cache, "tienda")
    return () => {
      if (getTiendaActiva() === slug) setTiendaActiva(null)
      limpiarTema()
    }
  }, [slug])

  useEffect(() => {
    let cancelado = false
    setEstado({ tipo: "cargando" })
    saasApi
      .resolverTienda(slug)
      .then(async (tienda) => {
        const marca = marcaDe(tienda)
        await cargarFuente(marca.fuente)
        if (cancelado) return
        aplicarTemaTienda(marca, "tienda")
        guardarCacheMarca(slug, marca)
        document.title = tienda.nombre
        setEstado({ tipo: "ok", tienda })
      })
      .catch((err) => {
        if (cancelado) return
        limpiarTema() // tienda inexistente o caída: se muestra con la identidad Tiendaria
        if (err instanceof ApiError && err.status === 404) setEstado({ tipo: "no-existe" })
        else setEstado({ tipo: "error", mensaje: err instanceof ApiError ? err.message : "No se pudo abrir la tienda" })
      })
    return () => {
      cancelado = true
    }
  }, [slug])

  const value = useMemo<TenantContextValue | null>(
    () => (estado.tipo === "ok" ? { tienda: estado.tienda, slug } : null),
    [estado, slug],
  )

  if (estado.tipo === "cargando") return <CargandoTienda />
  if (estado.tipo === "no-existe" || estado.tipo === "error") {
    return (
      <NotFoundPage
        titulo={estado.tipo === "no-existe" ? "Esta tienda no existe." : "No pudimos abrir esta tienda."}
        detalle={
          estado.tipo === "no-existe"
            ? `No hay ninguna tienda en la dirección "${slug}". Revisá cómo está escrita o buscala en el directorio.`
            : estado.mensaje
        }
        acciones={
          <Link to="/#tiendas" className={cn(buttonVariants())}>
            Ver tiendas
          </Link>
        }
      />
    )
  }
  if (!estado.tienda.disponible && !enLogin) return <TiendaNoDisponiblePage tienda={estado.tienda} />
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}
