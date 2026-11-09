import {
  Briefcase, CalendarBlank, ChartLineUp, ChartPieSlice, CreditCard, House, Money, Package, PaintBrush,
  Receipt, ShoppingBag, Sparkle, Storefront, TShirt, Ticket, Truck, Users, Warehouse, type Icon,
} from "@phosphor-icons/react"
import type { UsuarioRole } from "@/features/auth/types/auth.types"

const STAFF: UsuarioRole[] = ["ADMIN", "ENCARGADO_SUCURSAL", "CAJERO"]
const GESTION: UsuarioRole[] = ["ADMIN", "ENCARGADO_SUCURSAL"]

export interface NavItem {
  label: string
  href: string
  icon: Icon
  /** Solo badges con información real (hoy: días de prueba); se completa en runtime. */
  badge?: string
  /** Quién puede ENTRAR de verdad a esa ruta (`AdminRoute`/`StaffRoute` del
   * lado del router) — sin esto, default solo ADMIN. No se ofrece lo que el
   * router rebotaría al hacer clic. */
  roles?: UsuarioRole[]
}

export interface NavGroup {
  /** Clave estable para persistir abierto/cerrado (no cambiar a la ligera). */
  id: string
  title: string
  icon: Icon
  items: NavItem[]
}

/** Item suelto arriba de los grupos. */
export const NAV_INICIO: NavItem = { label: "Inicio", href: "/admin/dashboard", icon: House, roles: STAFF }

/** Menú del panel agrupado por tarea del gerente (spec Fase 6b §3). */
export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: "ventas",
    title: "Ventas",
    icon: ShoppingBag,
    items: [
      { label: "Ventas", href: "/admin/ventas", icon: Receipt, roles: GESTION },
      { label: "Cobros por confirmar", href: "/admin/cobros", icon: Money, roles: ["ADMIN", "CAJERO"] },
      { label: "Reservas", href: "/admin/reservas", icon: CalendarBlank, roles: STAFF },
      { label: "Cupones", href: "/admin/cupones", icon: Ticket },
    ],
  },
  {
    id: "productos",
    title: "Productos",
    icon: TShirt,
    items: [
      { label: "Catálogo", href: "/admin/catalogo", icon: Package },
      { label: "Inventario", href: "/admin/inventario", icon: Warehouse, roles: GESTION },
      { label: "Proveedores", href: "/admin/proveedores", icon: Truck },
    ],
  },
  {
    id: "analisis",
    title: "Análisis",
    icon: ChartPieSlice,
    items: [
      { label: "Reportes con IA", href: "/admin/reportes", icon: Sparkle, roles: GESTION },
      { label: "Predicciones", href: "/admin/ml", icon: ChartLineUp, roles: GESTION },
    ],
  },
  {
    id: "negocio",
    title: "Mi negocio",
    icon: Briefcase,
    items: [
      { label: "Sucursales", href: "/admin/sucursales", icon: Storefront },
      { label: "Equipo y permisos", href: "/admin/usuarios", icon: Users },
      { label: "Apariencia", href: "/admin/apariencia", icon: PaintBrush },
      { label: "Plan y suscripción", href: "/admin/suscripcion", icon: CreditCard },
    ],
  },
]

/** Título de la barra superior por ruta (gana el prefijo más largo, ver `tituloAdmin`). */
export const ADMIN_TITLES: Record<string, string> = {
  ...Object.fromEntries([NAV_INICIO, ...ADMIN_NAV_GROUPS.flatMap((g) => g.items)].map((i) => [i.href, i.label])),
  "/admin/suscripcion/activar": "Activar plan",
}

export const STORAGE_GRUPOS = "mirroria:admin-sidebar:grupos"
export const STORAGE_COLAPSADO = "mirroria:admin-sidebar:colapsado"
