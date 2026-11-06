import { Link } from "react-router-dom"
import { LogoTiendaActual } from "@/components/marca/logo-tienda-actual"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { HeaderNavLinks } from "./header-nav-links"
import { HeaderActions } from "./header-actions"
import { HeaderMobileDrawer } from "./header-mobile-drawer"

/**
 * Navbar Storefront Boutique de Lujo.
 * Arquitectura de 3 zonas libres de saturación horizontal (Anti-Slop).
 */
export function SiteHeader() {
  const ruta = useRutaTienda()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zona Izquierda: Marca e Identidad */}
        <div className="flex shrink-0 items-center">
          <Link
            to={ruta("/")}
            className="transition-opacity duration-200 hover:opacity-85 focus-visible:outline-hidden"
          >
            <LogoTiendaActual />
          </Link>
        </div>

        {/* Zona Central: Enlaces Canónicos Limpios (Desktop) */}
        <nav className="hidden items-center gap-6 lg:flex">
          <HeaderNavLinks />
        </nav>

        {/* Zona Derecha: Herramientas y Perfil */}
        <div className="flex items-center gap-2 sm:gap-3">
          <HeaderActions />
          <HeaderMobileDrawer />
        </div>
      </div>
    </header>
  )
}
