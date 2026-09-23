import {
  ArrowSquareOut, CalendarBlank, ChartBar, Money, Package,
  SignOut, Sparkle, Storefront, Ticket, Truck, Users, Warehouse, X, type Icon,
} from "@phosphor-icons/react"
import { Link, useLocation } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import type { UsuarioRole } from "@/features/auth/types/auth.types"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "cn"
import { ROLES_CONFIG } from "@/features/admin/components/usuario-rol-editor/usuario-rol-editor.data"

interface NavItem {
  label: string
  href: string
  icon: Icon
  badge?: string
  /** Quién puede ENTRAR de verdad a esa ruta (`AdminRoute`/`StaffRoute` del
   * lado del router) — sin esto, default solo ADMIN. Antes el sidebar
   * mostraba las 10 secciones a cualquier rol de staff aunque el router lo
   * rebotara a "/" al hacer clic; ahora no se ofrece lo que no se puede usar. */
  roles?: UsuarioRole[]
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: "Catálogo y Stock",
    items: [
      { label: "Catálogo", href: "/admin/catalogo", icon: Package, badge: "Prendas" },
      {
        label: "Inventario",
        href: "/admin/inventario",
        icon: Warehouse,
        badge: "Stock",
        roles: ["ADMIN", "ENCARGADO_SUCURSAL"],
      },
    ],
  },
  {
    title: "Ventas y Promociones",
    items: [
      { label: "Ventas", href: "/admin/ventas", icon: ChartBar, roles: ["ADMIN", "ENCARGADO_SUCURSAL"] },
      { label: "Cobros", href: "/admin/cobros", icon: Money, roles: ["ADMIN", "CAJERO"] },
      {
        label: "Reservas",
        href: "/admin/reservas",
        icon: CalendarBlank,
        roles: ["ADMIN", "ENCARGADO_SUCURSAL", "CAJERO"],
      },
      { label: "Cupones", href: "/admin/cupones", icon: Ticket, badge: "Promo" },
      {
        label: "Reportes IA",
        href: "/admin/reportes",
        icon: Sparkle,
        badge: "IA",
        roles: ["ADMIN", "ENCARGADO_SUCURSAL"],
      },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { label: "Sucursales", href: "/admin/sucursales", icon: Storefront },
      { label: "Proveedores", href: "/admin/proveedores", icon: Truck },
    ],
  },
  {
    title: "Administración",
    items: [{ label: "Usuarios", href: "/admin/usuarios", icon: Users }],
  },
]

function getInitials(name?: string): string {
  if (!name) return "AD"
  const parts = name.trim().split(/\s+/)
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

import { BrandLogo } from "@/components/brand-logo"

export function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const rolLabel = user?.role ? (ROLES_CONFIG[user.role]?.label ?? user.role) : "Admin"

  // Solo se ofrecen los items que este rol puede realmente abrir (ver el
  // porqué en `NavItem.roles`) — los grupos que se quedan sin items ni
  // siquiera se muestran (ej. "Administración" para un CAJERO).
  const navGroups = ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => (item.roles ?? ["ADMIN"]).includes(user?.role as UsuarioRole)),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <BrandLogo size="default" />
        </Link>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] font-medium border-primary/30 bg-primary/10 text-primary uppercase tracking-wider">
            {rolLabel}
          </Badge>
          {onNavigate && (
            <Button variant="ghost" size="sm" onClick={onNavigate} className="size-7 p-0 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 xl:px-4 xl:py-5 space-y-5 xl:space-y-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-2 xl:py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-normal", active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-border/60 p-4 xl:p-5 bg-muted/20 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar size="default">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {getInitials(user?.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{user?.fullName || "Administrador"}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <Link to="/" onClick={onNavigate} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 flex-1 text-xs gap-1.5")}>
            <ArrowSquareOut className="size-3.5" />
            Tienda
          </Link>
          <Button variant="ghost" size="sm" onClick={logout} className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive" title="Cerrar sesión">
            <SignOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
