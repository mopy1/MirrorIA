import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useMatch, useParams } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { NotFoundPage } from "@/features/errors/pages/NotFoundPage"
import { saasApi } from "@/features/saas/api/saasApi"
import { TiendaNoDisponiblePage } from "@/features/saas/pages/TiendaNoDisponiblePage"
import { ApiError } from "@/lib/api"
import { getTiendaActiva, setTiendaActiva } from "@/lib/tienda-activa"
import type { TiendaPublica } from "@/types/tienda.types"
import { cn } from "cn"
import { TenantContext, type TenantContextValue } from "./tenant-context"

type Estado = { tipo: "cargando" } | { tipo: "no-existe" } | { tipo: "error"; mensaje: string } | { tipo: "ok"; tienda: TiendaPublica }

function CargandoTienda() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 border-b border-border/60 px-4 sm:px-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="ml-auto h-8 w-48" />
      </div>
      <Skeleton className="mx-auto mt-8 h-[60vh] w-full max-w-7xl rounded-2xl" />
    </div>
  )
}

/**
 * Resuelve `/t/:slug` (`GET /saas/tiendas/:slug`) y publica la tienda en
 * contexto. Fija la tienda activa EN EL RENDER (idempotente) para que el
 * primer fetch de los hijos ya lleve `X-Tenant`, y la limpia al desmontarse.
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const { slug = "" } = useParams()
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" })
  // El staff de una tienda suspendida/vencida tiene que poder entrar a su panel.
  const enLogin = useMatch("/t/:slug/login") !== null
  setTiendaActiva(slug)

  // Layout effect: corre antes que los efectos pasivos de los hijos (también
  // en el doble montaje de StrictMode). Solo limpia si sigue siendo la suya.
  useLayoutEffect(() => {
    setTiendaActiva(slug)
    return () => {
      if (getTiendaActiva() === slug) setTiendaActiva(null)
    }
  }, [slug])

  useEffect(() => {
    let cancelado = false
    setEstado({ tipo: "cargando" })
    saasApi
      .resolverTienda(slug)
      .then((tienda) => !cancelado && setEstado({ tipo: "ok", tienda }))
      .catch((err) => {
        if (cancelado) return
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
