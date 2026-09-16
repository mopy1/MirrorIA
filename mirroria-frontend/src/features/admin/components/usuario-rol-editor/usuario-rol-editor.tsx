import { useState } from "react"
import { PencilSimple, Storefront, WarningCircle } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Sucursal } from "@/features/branches/types/branches.types"
import { cn } from "cn"
import type { UsuarioAdmin } from "../../api/usuariosAdminApi"
import { ROLES_CONFIG, ROLES_CON_SUCURSAL } from "./usuario-rol-editor.data"
import { UsuarioRolDialog } from "./usuario-rol-dialog"

interface UsuarioRolEditorProps {
  usuario: UsuarioAdmin
  sucursales: Sucursal[]
  onGuardado: () => void
}

export function UsuarioRolEditor({ usuario, sucursales, onGuardado }: UsuarioRolEditorProps) {
  const [open, setOpen] = useState(false)

  const config = ROLES_CONFIG[usuario.role] ?? {
    label: usuario.role,
    badgeClasses: "bg-muted text-muted-foreground border-border",
    icon: PencilSimple,
  }
  const CurrentIcon = config.icon
  const sucursalNombre = sucursales.find((s) => s.id === usuario.sucursalId)?.nombre

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("gap-1.5 py-1 px-2.5 text-xs transition-colors", config.badgeClasses)}
          >
            <CurrentIcon className="size-3.5 shrink-0" />
            <span>{config.label}</span>
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
          >
            <PencilSimple className="size-3.5 mr-1" />
            Cambiar
          </Button>
        </div>

        {sucursalNombre && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Storefront className="size-3.5 shrink-0 text-muted-foreground/70" />
            <span>{sucursalNombre}</span>
          </div>
        )}

        {ROLES_CON_SUCURSAL.includes(usuario.role) && !usuario.sucursalId && (
          <Badge
            variant="outline"
            className="w-fit gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-normal py-0.5"
          >
            <WarningCircle className="size-3 shrink-0" />
            <span>Sin sucursal asignada</span>
          </Badge>
        )}
      </div>

      <UsuarioRolDialog
        open={open}
        onOpenChange={setOpen}
        usuario={usuario}
        sucursales={sucursales}
        onGuardado={onGuardado}
      />
    </>
  )
}
