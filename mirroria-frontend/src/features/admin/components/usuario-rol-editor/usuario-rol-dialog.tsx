import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Sucursal } from "@/features/branches/types/branches.types"
import { useCreateResource } from "@/hooks/useCreateResource"
import { cn } from "cn"
import type { UsuarioAdmin } from "../../api/usuariosAdminApi"
import { usuariosAdminApi } from "../../api/usuariosAdminApi"
import { SucursalField } from "./sucursal-field"
import { getInitials, ROLES_CONFIG, ROLES_CON_SUCURSAL } from "./usuario-rol-editor.data"

interface UsuarioRolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioAdmin
  sucursales: Sucursal[]
  onGuardado: () => void
}

export function UsuarioRolDialog({
  open,
  onOpenChange,
  usuario,
  sucursales,
  onGuardado,
}: UsuarioRolDialogProps) {
  const [role, setRole] = useState(usuario.role)
  const [sucursalId, setSucursalId] = useState(usuario.sucursalId ?? "")
  const { submit, isLoading, error } = useCreateResource(
    (dto: { role: string; sucursalId?: string }) =>
      usuariosAdminApi.updateRol(usuario.id, dto.role, dto.sucursalId)
  )

  const config = ROLES_CONFIG[usuario.role] ?? {
    label: usuario.role,
    badgeClasses: "bg-muted text-muted-foreground border-border",
  }

  const necesitaSucursal = ROLES_CON_SUCURSAL.includes(role)
  const sucursalInvalida = necesitaSucursal && !sucursalId
  const cambioSinGuardar = role !== usuario.role || sucursalId !== (usuario.sucursalId ?? "")

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setRole(usuario.role)
      setSucursalId(usuario.sucursalId ?? "")
    }
    onOpenChange(isOpen)
  }

  async function handleGuardar() {
    const ok = await submit({ role, sucursalId: necesitaSucursal ? sucursalId : undefined })
    if (ok) {
      onOpenChange(false)
      onGuardado()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modificar rol de usuario</DialogTitle>
          <DialogDescription>Asigna permisos y la sucursal operativa para esta cuenta.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
          <Avatar size="default">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {getInitials(usuario.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-foreground truncate">{usuario.fullName}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">{usuario.email}</p>
          </div>
          <Badge variant="outline" className={cn("text-xs shrink-0", config.badgeClasses)}>
            {config.label}
          </Badge>
        </div>

        <FieldGroup className="py-1">
          <Field>
            <FieldLabel>Rol en el sistema</FieldLabel>
            <Select value={role} onValueChange={(v) => setRole(v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar rol">
                  {(v: string) => ROLES_CONFIG[v]?.label ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLES_CONFIG).map(([key, item]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col py-0.5">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {necesitaSucursal && (
            <SucursalField
              sucursalId={sucursalId}
              onSucursalChange={setSucursalId}
              sucursales={sucursales}
              sucursalInvalida={sucursalInvalida}
            />
          )}

          {error && <FieldError>{error}</FieldError>}
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={isLoading || sucursalInvalida || !cambioSinGuardar} onClick={handleGuardar}>
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
