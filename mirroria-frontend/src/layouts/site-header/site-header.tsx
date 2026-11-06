import { List, ShoppingBag } from "@phosphor-icons/react"
import { Link, useLocation } from "react-router-dom"
import { EstadoConexionBadge } from "@/components/common/estado-conexion-badge"
import { SearchInput } from "@/components/common/SearchInput"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useCart } from "@/hooks/useCart"
import { CategoriesMenu } from "./categories-menu"
import { HeaderAuth } from "./header-auth"
import { NAV_ITEMS } from "./site-header.data"
import { LogoTiendaActual } from "@/components/marca/logo-tienda-actual"
import { cn } from "cn"
import { useRutaTienda } from "@/hooks/useRutaTienda"

export function SiteHeader() {
  const { itemCount } = useCart()
  const ruta = useRutaTienda()
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to={ruta("/")} className="flex min-w-0 shrink-0 items-center transition-opacity hover:opacity-90">
          <LogoTiendaActual />
        </Link>

        <nav className="hidden shrink-0 items-center gap-1 lg:flex">
          <CategoriesMenu />
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={ruta(item.href)}
              className={cn(
                "relative rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname.startsWith(ruta(item.href)) && "text-foreground",
              )}
            >
              {item.label}
              {/* Subrayado del ítem activo con el acento de la marca (spec §B.1). */}
              {pathname.startsWith(ruta(item.href)) && (
                <span className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-brand-accent" aria-hidden />
              )}
            </Link>
          ))}
        </nav>

        <SearchInput className="hidden max-w-xs flex-1 md:block" />

        <div className="ml-auto flex items-center gap-2">
          <EstadoConexionBadge />
          <Link to={ruta("/carrito")} className="relative hidden sm:inline-flex">
            <Button variant="ghost" size="icon" aria-label="Carrito">
              <ShoppingBag />
            </Button>
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full bg-brand-accent px-1 text-[11px] text-brand-accent-foreground">
                {itemCount}
              </Badge>
            )}
          </Link>

          <HeaderAuth compact />

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Abrir menú" className="lg:hidden">
                  <List />
                </Button>
              }
            />

            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="sr-only">Menú de la tienda</SheetTitle>
                <LogoTiendaActual />
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4">
                <SearchInput />

                <nav className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      to={ruta(item.href)}
                      className="rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    to={ruta("/carrito")}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    Carrito
                    {itemCount > 0 && <Badge>{itemCount}</Badge>}
                  </Link>
                </nav>

                <HeaderAuth />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
