import { Suspense, useState, type ReactNode } from "react"
import { PageFallback } from "@/components/common/PageFallback"
import { EstadoConexionBadge } from "@/components/common/estado-conexion-badge"
import { ArrowSquareOut, List } from "@phosphor-icons/react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ROLES_CONFIG } from "@/features/admin/components/usuario-rol-editor/usuario-rol-editor.data"
import { useAuth } from "@/hooks/useAuth"
import { AdminSidebarContent } from "./admin-sidebar-content"
import { LogoTienda } from "@/components/marca/logo-tienda"
import { useTemaAdmin } from "./useTemaAdmin"
import { useMiSuscripcion } from "@/features/subscription/hooks/useMiSuscripcion"
import { AdminAvisos } from "./admin-avisos"
import { SelectorTiendaAdmin } from "./selector-tienda-admin"
import { tituloAdmin } from "./admin-sidebar-logica"
import { useSidebarColapsado } from "./admin-sidebar-use-colapsado"
import { cn } from "cn"

/** Layout de `/admin/*` (ruta padre con <Outlet/>: no se remonta al navegar). */
export function AdminLayout({ children }: { children?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { colapsado, alternar: alternarColapso } = useSidebarColapsado()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const esAdmin = user?.role === "ADMIN"
  // Solo el ADMIN puede leer su suscripción (los demás roles reciben 403).
  const { data: miSuscripcion } = useMiSuscripcion(esAdmin)
  const tiendaHref = user?.tenant ? `/t/${user.tenant.slug}` : "/"
  // Logo y colores de SU tienda en el panel (parcial: neutros y Geist fijos).
  const { marca, nombre } = useTemaAdmin(user?.tenant?.slug ?? null)
  const tiendaNombre = nombre ?? user?.tenant?.nombre ?? "Mi tienda"

  const currentTitle = tituloAdmin(pathname)
  const rolLabel = user?.role ? (ROLES_CONFIG[user.role]?.label ?? user.role) : "Admin"

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row bg-background">
      {/* Mobile Sticky Topbar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0 text-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú de navegación"
          >
            <List className="size-5" />
          </Button>
          <Link to={tiendaHref} className="inline-flex items-center transition-opacity hover:opacity-90">
            <LogoTienda nombre={tiendaNombre} logoUrl={marca?.logoUrl} className="max-w-44 [&_span:last-child]:text-base" />
          </Link>
          <Badge variant="outline" className="text-[10px] font-medium border-primary/30 bg-primary/10 text-primary">
            {rolLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <EstadoConexionBadge tenantId={user?.tenant?.slug} />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-72 p-0 flex flex-col h-full bg-card border-r border-border">
          <AdminSidebarContent onNavigate={() => setMobileOpen(false)} suscripcion={miSuscripcion?.suscripcion ?? null} tiendaNombre={tiendaNombre} logoUrl={marca?.logoUrl ?? null} />
        </SheetContent>
      </Sheet>

      {/* Sidebar de escritorio: w-64/w-72, o 4.5rem contraído a íconos (persistido). */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col overflow-hidden border-r border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-dvh lg:self-start",
          "transition-[width] duration-200 ease-out motion-reduce:transition-none",
          colapsado ? "lg:w-18" : "lg:w-64 xl:w-72",
        )}
      >
        <AdminSidebarContent
          suscripcion={miSuscripcion?.suscripcion ?? null}
          tiendaNombre={tiendaNombre}
          logoUrl={marca?.logoUrl ?? null}
          colapsado={colapsado}
          onAlternarColapso={alternarColapso}
        />
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-muted/15">
        {/* Desktop Topbar Header */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 shrink-0 items-center justify-between border-b border-border/60 bg-card/85 px-8 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm">
            <SelectorTiendaAdmin />
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-foreground">{currentTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <EstadoConexionBadge tenantId={user?.tenant?.slug} />
            <Link
              to={tiendaHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ArrowSquareOut className="size-3.5" />
              <span>Ver mi tienda</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <AdminAvisos suscripcion={miSuscripcion?.suscripcion ?? null} esAdmin={esAdmin} />
        <div className="flex-1">
          {/* Suspense acá: al abrir una página diferida el sidebar no desaparece. */}
          <Suspense fallback={<PageFallback />}>{children ?? <Outlet />}</Suspense>
        </div>
      </main>
    </div>
  )
}
