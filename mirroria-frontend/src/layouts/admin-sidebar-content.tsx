import type { UsuarioRole } from "@/features/auth/types/auth.types"
import { useAuth } from "@/hooks/useAuth"
import { ROLES_CONFIG } from "@/features/admin/components/usuario-rol-editor/usuario-rol-editor.data"
import type { SuscripcionDto } from "@/types/plan.types"
import { ADMIN_NAV_GROUPS, VER_MI_TIENDA } from "./admin-sidebar.data"
import { AdminSidebarFooter } from "./admin-sidebar-footer"
import { AdminSidebarHeader } from "./admin-sidebar-header"
import { AdminSidebarNav } from "./admin-sidebar-nav"

interface AdminSidebarContentProps {
  onNavigate?: () => void
  /** Suscripción de la tienda (solo la ve el ADMIN): badge de plan y de días de prueba. */
  suscripcion: SuscripcionDto | null
}

export function AdminSidebarContent({ onNavigate, suscripcion }: AdminSidebarContentProps) {
  const { user } = useAuth()
  const rolLabel = user?.role ? (ROLES_CONFIG[user.role]?.label ?? user.role) : "Admin"
  const tiendaHref = user?.tenant ? `/t/${user.tenant.slug}` : "/"

  // Solo se ofrecen los items que este rol puede realmente abrir (ver el
  // porqué en `NavItem.roles`) — los grupos que se quedan sin items ni
  // siquiera se muestran (ej. "Administración" para un CAJERO).
  const navGroups = ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => (item.roles ?? ["ADMIN"]).includes(user?.role as UsuarioRole))
      .map((item) => {
        if (item.href === VER_MI_TIENDA) return { ...item, href: tiendaHref }
        if (item.href === "/admin/suscripcion" && suscripcion?.estado === "TRIAL") return { ...item, badge: `${suscripcion.diasRestantes} días` }
        return item
      }),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-card">
      <AdminSidebarHeader
        tiendaNombre={user?.tenant?.nombre ?? "MirrorIA"}
        subtitulo={suscripcion ? `Plan ${suscripcion.plan.nombre}` : rolLabel}
        tiendaHref={tiendaHref}
        onNavigate={onNavigate}
      />
      <AdminSidebarNav groups={navGroups} onNavigate={onNavigate} />
      <AdminSidebarFooter rolLabel={rolLabel} tiendaHref={tiendaHref} onNavigate={onNavigate} />
    </div>
  )
}
