import { List, ShoppingBag } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
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
import { BrandLogo } from "@/components/brand-logo"

export function SiteHeader() {
  const { itemCount } = useCart()

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="shrink-0 flex items-center transition-opacity hover:opacity-90">
          <BrandLogo />
        </Link>

        <nav className="hidden shrink-0 items-center gap-1 lg:flex">
          <CategoriesMenu />
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <SearchInput className="hidden max-w-xs flex-1 md:block" />

        <div className="ml-auto flex items-center gap-2">
          <Link to="/carrito" className="relative hidden sm:inline-flex">
            <Button variant="ghost" size="icon" aria-label="Carrito">
              <ShoppingBag />
            </Button>
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-[11px]">
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
                <SheetTitle className="sr-only">Menú MirrorIA</SheetTitle>
                <BrandLogo />
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4">
                <SearchInput />

                <nav className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    to="/carrito"
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
