import { useState, type ReactNode } from "react"
import { ArrowSquareOut, List } from "@phosphor-icons/react"
import { Link, useLocation } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { AdminSidebarContent } from "./admin-sidebar-content"
import { BrandLogo } from "@/components/brand-logo"

const ADMIN_TITLES: Record<string, string> = {
  "/admin/catalogo": "Catálogo",
  "/admin/inventario": "Inventario & Stock",
  "/admin/ventas": "Ventas",
  "/admin/reservas": "Reservas",
  "/admin/sucursales": "Sucursales",
  "/admin/proveedores": "Proveedores",
  "/admin/usuarios": "Usuarios & Roles",
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  const currentTitle = Object.entries(ADMIN_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ?? "Administración"

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
          <Link to="/" className="inline-flex items-center transition-opacity hover:opacity-90">
            <BrandLogo size="sm" />
          </Link>
          <Badge variant="outline" className="text-[10px] font-medium border-primary/30 bg-primary/10 text-primary">
            Admin
          </Badge>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-72 p-0 flex flex-col h-full bg-card border-r border-border">
          <AdminSidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sticky Sidebar (w-64 en laptops, w-72 en pantallas grandes) */}
      <aside className="hidden shrink-0 flex-col border-r border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 xl:w-72 lg:self-start lg:overflow-y-auto">
        <AdminSidebarContent />
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-muted/15">
        {/* Desktop Topbar Header */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 shrink-0 items-center justify-between border-b border-border/60 bg-card/85 px-8 backdrop-blur-md">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-muted-foreground">Admin</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-foreground">{currentTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Base de Datos Conectada</span>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ArrowSquareOut className="size-3.5" />
              <span>Ver Tienda</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
