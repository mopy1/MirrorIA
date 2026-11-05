import { useState } from "react"
import { ErrorConPlan } from "@/components/common/ErrorConPlan"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import type { Sucursal } from "@/features/branches/types/branches.types"
import { useCreateResource } from "@/hooks/useCreateResource"
import type { UsuarioAdmin } from "../../api/usuariosAdminApi"
import { usuariosAdminApi } from "../../api/usuariosAdminApi"
import { RolField } from "./rol-field"
import { SucursalField } from "./sucursal-field"
import { UsuarioResumen } from "./usuario-resumen"
import { ROLES_CON_SUCURSAL } from "./usuario-rol-editor.data"

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

        <UsuarioResumen usuario={usuario} />

        <FieldGroup className="py-1">
          <RolField role={role} onRoleChange={setRole} />

          {necesitaSucursal && (
            <SucursalField
              sucursalId={sucursalId}
              onSucursalChange={setSucursalId}
              sucursales={sucursales}
              sucursalInvalida={sucursalInvalida}
            />
          )}

          <ErrorConPlan mensaje={error} />
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
