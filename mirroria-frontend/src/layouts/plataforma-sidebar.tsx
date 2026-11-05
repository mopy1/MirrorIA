import { ChartLineUp, MapPin, SignOut, Storefront, Tag, type Icon } from "@phosphor-icons/react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { TiendariaLogo } from "@/components/marca/tiendaria-logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "cn"

const NAV: { label: string; href: string; icon: Icon }[] = [
  { label: "Resumen", href: "/plataforma/resumen", icon: ChartLineUp },
  { label: "Tiendas", href: "/plataforma/inquilinos", icon: Storefront },
  { label: "Planes", href: "/plataforma/planes", icon: Tag },
  { label: "Ciudades", href: "/plataforma/ciudades", icon: MapPin },
]

/** Sidebar de `/plataforma/*` (DUENO_PLATAFORMA). */
export function PlataformaSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  function salir() {
    logout()
    navigate("/plataforma/login")
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-5">
        <Link to="/" onClick={onNavigate} className="transition-opacity hover:opacity-90">
          <TiendariaLogo />
        </Link>
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[10px] font-semibold text-primary">
          Plataforma
        </Badge>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-5">
        {NAV.map((item) => {
          const activo = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors",
                activo ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <item.icon className="size-4" /> {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="space-y-3 border-t border-border/60 bg-muted/20 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user?.fullName ?? "Dueño de plataforma"}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={salir} className="w-full justify-start gap-1.5">
          <SignOut /> Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
