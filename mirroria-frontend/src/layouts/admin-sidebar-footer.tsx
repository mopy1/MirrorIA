import { ArrowSquareOut, SignOut } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "cn"

function getInitials(name?: string): string {
  if (!name) return "AD"
  const parts = name.trim().split(/\s+/)
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Pie del sidebar: quién está logueada, su rol, ir a la tienda y cerrar sesión. */
export function AdminSidebarFooter({ rolLabel, tiendaHref, onNavigate }: { rolLabel: string; tiendaHref: string; onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  return (
    <div className="mt-auto border-t border-border/60 p-4 xl:p-5 bg-muted/20 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar size="default">
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">{getInitials(user?.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{user?.fullName || "Administrador"}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">{user?.email}</p>
          <Badge variant="outline" className="mt-1 text-[10px] font-medium border-primary/30 bg-primary/10 text-primary uppercase tracking-wider">
            {rolLabel}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pt-1">
        <Link to={tiendaHref} onClick={onNavigate} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 flex-1 text-xs gap-1.5")}>
          <ArrowSquareOut className="size-3.5" />
          Tienda
        </Link>
        <Button variant="ghost" size="sm" onClick={logout} className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive" title="Cerrar sesión">
          <SignOut className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
