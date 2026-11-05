import { List } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { BrandLogo } from "@/components/brand-logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/useAuth"
import { destinoTrasLogin } from "@/lib/destino-sesion"
import { cn } from "cn"
import { SAAS_NAV } from "./saas-header.data"

const linkClass = "rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"

/** Navbar de la plataforma: el único botón primario es "Crear mi tienda". */
export function SaasHeader() {
  const { user } = useAuth()
  const entrar = user ? { to: destinoTrasLogin(user), label: "Ir a mi panel" } : { to: "/entrar", label: "Entrar" }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="shrink-0 transition-opacity hover:opacity-90" aria-label="MirrorIA, inicio">
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {SAAS_NAV.map((item) => (
            <Link key={item.href} to={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to={entrar.to} className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>
            {entrar.label}
          </Link>
          <Link to="/registro-tienda" className={cn(buttonVariants())}>
            Crear mi tienda
          </Link>
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Abrir menú" className="md:hidden">
                  <List />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="sr-only">Menú MirrorIA</SheetTitle>
                <BrandLogo />
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {SAAS_NAV.map((item) => (
                  <Link key={item.href} to={item.href} className={cn(linkClass, "text-foreground")}>
                    {item.label}
                  </Link>
                ))}
                <Link to={entrar.to} className={cn(linkClass, "text-foreground")}>
                  {entrar.label}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
