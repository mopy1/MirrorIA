import {
  ArrowSquareOut, CalendarBlank, ChartBar, CreditCard, Money, Package, PaintBrush,
  Sparkle, Storefront, Ticket, Truck, Users, Warehouse, type Icon,
} from "@phosphor-icons/react"
import type { UsuarioRole } from "@/features/auth/types/auth.types"

const STAFF: UsuarioRole[] = ["ADMIN", "ENCARGADO_SUCURSAL", "CAJERO"]

/** Marcador: el sidebar lo reemplaza por `/t/<slug>`. */
export const VER_MI_TIENDA = "__ver_mi_tienda__"

export interface NavItem {
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

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    // "Ver mi tienda" depende del slug: el href se completa en el sidebar.
    title: "Mi tienda",
    items: [
      { label: "Ver mi tienda", href: VER_MI_TIENDA, icon: ArrowSquareOut, roles: STAFF },
      { label: "Apariencia", href: "/admin/apariencia", icon: PaintBrush },
      { label: "Plan y suscripción", href: "/admin/suscripcion", icon: CreditCard },
    ],
  },
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

