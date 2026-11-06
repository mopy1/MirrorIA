import { Fragment } from "react"
import { useLocation } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { NavGroup, NavItem } from "./admin-sidebar.data"
import { AdminSidebarGrupo } from "./admin-sidebar-grupo"
import { AdminSidebarItem } from "./admin-sidebar-item"
import { esRutaActiva } from "./admin-sidebar-logica"
import { useSidebarAcordeon } from "./admin-sidebar-use-acordeon"

interface Props {
  /** "Inicio" (si el rol lo puede abrir) va suelto arriba de los grupos. */
  inicio: NavItem | null
  groups: NavGroup[]
  colapsado?: boolean
  onNavigate?: () => void
}

/** Navegación del panel (ya filtrada por rol): acordeón completo o columna de íconos. */
export function AdminSidebarNav({ inicio, groups, colapsado = false, onNavigate }: Props) {
  const { pathname } = useLocation()
  const { estaAbierto, alternar } = useSidebarAcordeon(groups, pathname)

  if (colapsado) {
    return (
      <TooltipProvider delay={150}>
        <nav aria-label="Menú del panel" className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {inicio && <AdminSidebarItem item={inicio} activo={esRutaActiva(pathname, inicio.href)} colapsado onNavigate={onNavigate} />}
          {groups.map((group, i) => (
            <Fragment key={group.id}>
              {(inicio || i > 0) && <Separator className="mx-auto my-2 w-6!" />}
              <ul aria-label={group.title} className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <AdminSidebarItem item={item} activo={esRutaActiva(pathname, item.href)} colapsado onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            </Fragment>
          ))}
        </nav>
      </TooltipProvider>
    )
  }

  return (
    <nav aria-label="Menú del panel" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
      {inicio && <AdminSidebarItem item={inicio} activo={esRutaActiva(pathname, inicio.href)} onNavigate={onNavigate} />}
      {groups.map((group) => (
        <AdminSidebarGrupo
          key={group.id}
          group={group}
          pathname={pathname}
          abierto={estaAbierto(group.id)}
          onAbiertoChange={(abierto) => alternar(group.id, abierto)}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  )
}
