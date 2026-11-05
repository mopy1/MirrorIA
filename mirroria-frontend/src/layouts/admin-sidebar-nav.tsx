import { Link, useLocation } from "react-router-dom"
import { cn } from "cn"
import type { NavGroup } from "./admin-sidebar.data"

/** Grupos de navegación del panel (ya filtrados por rol). */
export function AdminSidebarNav({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 xl:px-4 xl:py-5 space-y-5 xl:space-y-6">
      {groups.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.title}</p>
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
                    active ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
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
  )
}
