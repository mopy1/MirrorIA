import { useAuth } from "@/hooks/useAuth"
import { ROLES_CONFIG } from "@/features/admin/components/usuario-rol-editor/usuario-rol-editor.data"
import type { SuscripcionDto } from "@/types/plan.types"
import { ADMIN_NAV_GROUPS, NAV_INICIO } from "./admin-sidebar.data"
import { AdminSidebarFooter } from "./admin-sidebar-footer"
import { AdminSidebarHeader } from "./admin-sidebar-header"
import { navParaRol, puedeVer } from "./admin-sidebar-logica"
import { AdminSidebarNav } from "./admin-sidebar-nav"

interface AdminSidebarContentProps {
  onNavigate?: () => void
  /** Suscripción de la tienda (solo la ve el ADMIN): plan en la cabecera y días de prueba. */
  suscripcion: SuscripcionDto | null
  tiendaNombre: string
  logoUrl: string | null
  /** Menú de escritorio contraído a íconos (el `Sheet` móvil nunca lo usa). */
  colapsado?: boolean
  onAlternarColapso?: () => void
}

export function AdminSidebarContent({ onNavigate, suscripcion, tiendaNombre, logoUrl, colapsado = false, onAlternarColapso }: AdminSidebarContentProps) {
  const { user } = useAuth()
  const rolLabel = user?.role ? (ROLES_CONFIG[user.role]?.label ?? user.role) : "Admin"
  const tiendaHref = user?.tenant ? `/t/${user.tenant.slug}` : "/"
  // Solo se ofrece lo que este rol puede abrir; los grupos vacíos no se muestran (ej. "Mi negocio" para un CAJERO).
  const groups = navParaRol(ADMIN_NAV_GROUPS, user?.role, suscripcion)
  const inicio = puedeVer(NAV_INICIO, user?.role) ? NAV_INICIO : null

  return (
    <div className="flex h-full flex-col bg-card">
      <AdminSidebarHeader
        tiendaNombre={tiendaNombre}
        logoUrl={logoUrl}
        subtitulo={suscripcion ? `Plan ${suscripcion.plan.nombre}` : rolLabel}
        tiendaHref={tiendaHref}
        colapsado={colapsado}
        onNavigate={onNavigate}
      />
      <AdminSidebarNav inicio={inicio} groups={groups} colapsado={colapsado} onNavigate={onNavigate} />
      <AdminSidebarFooter
        rolLabel={rolLabel}
        tiendaHref={tiendaHref}
        colapsado={colapsado}
        onAlternarColapso={onAlternarColapso}
        onNavigate={onNavigate}
      />
    </div>
  )
}
