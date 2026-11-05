import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { useTemaTiendaria } from "@/hooks/useTemaTiendaria"
import { SaasFooter } from "./saas-footer"
import { SaasHeader } from "./saas-header"

/** Superficies de Tiendaria (`/`, `/planes`, `/registro-tienda`, `/entrar`, 404): siempre con su identidad. */
export function SaasLayout() {
  useTemaTiendaria()
  const { hash, pathname } = useLocation()

  // Los links "/#tiendas", "/#planes" y "/#preguntas" bajan a su sección (el router no lo hace solo).
  useEffect(() => {
    // Sin `return` del scroll: en Chromium nuevo scrollTo/scrollIntoView devuelven una Promise.
    if (!hash) {
      window.scrollTo({ top: 0 })
    } else {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" })
    }
  }, [hash, pathname])

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SaasHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SaasFooter />
    </div>
  )
}
