import { Link, useLocation } from "react-router-dom"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { CategoriesDropdown } from "./categories-dropdown"
import { cn } from "cn"

interface NavLinkItem {
  label: string
  href: string
  badge?: string
}

const LINKS: NavLinkItem[] = [
  { label: "Colección", href: "/tienda" },
  { label: "Probador IA", href: "/probador", badge: "IA" },
  { label: "Sucursales", href: "/sucursales" },
]

/** Enlaces centrales de navegación con resaltado activo boutique. */
export function HeaderNavLinks() {
  const ruta = useRutaTienda()
  const { pathname } = useLocation()

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* 1. Colección */}
      <Link
        to={ruta("/tienda")}
        className={cn(
          "relative rounded-md px-2.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground",
          pathname.startsWith(ruta("/tienda")) && "text-foreground font-semibold"
        )}
      >
        <span>Colección</span>
        {pathname.startsWith(ruta("/tienda")) && (
          <span className="absolute inset-x-2 -bottom-2 h-0.5 rounded-full bg-brand-accent" aria-hidden />
        )}
      </Link>

      {/* 2. Categorías Dropdown */}
      <CategoriesDropdown />

      {/* 3. Probador IA & 4. Sucursales */}
      {LINKS.slice(1).map((item) => {
        const itemRuta = ruta(item.href)
        const isActive = pathname.startsWith(itemRuta)

        return (
          <Link
            key={item.href}
            to={itemRuta}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground",
              isActive && "text-foreground font-semibold"
            )}
          >
            <span>{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-brand-accent/15 px-1.5 py-0.2 text-[9px] font-semibold text-brand-accent tracking-normal">
                {item.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute inset-x-2 -bottom-2 h-0.5 rounded-full bg-brand-accent" aria-hidden />
            )}
          </Link>
        )
      })}
    </div>
  )
}
