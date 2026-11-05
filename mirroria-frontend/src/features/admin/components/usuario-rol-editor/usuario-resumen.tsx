import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import type { UsuarioAdmin } from "../../api/usuariosAdminApi"
import { getInitials, ROLES_CONFIG } from "./usuario-rol-editor.data"

/** Tarjeta con la cuenta que se está editando y su rol actual. */
export function UsuarioResumen({ usuario }: { usuario: UsuarioAdmin }) {
  const config = ROLES_CONFIG[usuario.role] ?? {
    label: usuario.role,
    badgeClasses: "bg-muted text-muted-foreground border-border",
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
      <Avatar size="default">
        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">{getInitials(usuario.fullName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-foreground truncate">{usuario.fullName}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">{usuario.email}</p>
      </div>
      <Badge variant="outline" className={cn("text-xs shrink-0", config.badgeClasses)}>
        {config.label}
      </Badge>
    </div>
  )
}
