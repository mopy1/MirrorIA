import { UserCheck, UserMinus } from "@phosphor-icons/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Sucursal } from "@/features/branches/types/branches.types"
import type { UsuarioAdmin } from "../../api/usuariosAdminApi"
import { getInitials, UsuarioRolEditor } from "../usuario-rol-editor"

interface UsuariosTableProps {
  usuarios: UsuarioAdmin[]
  sucursales: Sucursal[]
  isToggling: boolean
  onToggleEstado: (id: string, isActiveActual: boolean) => void
  onReload: () => void
}

export function UsuariosTable({
  usuarios,
  sucursales,
  isToggling,
  onToggleEstado,
  onReload,
}: UsuariosTableProps) {
  return (
    <Card className="overflow-hidden p-0 border">
      <CardContent className="p-0">
        <Table className="min-w-[620px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[38%] font-medium">Usuario</TableHead>
              <TableHead className="w-[32%] font-medium">Rol y Asignación</TableHead>
              <TableHead className="w-[15%] font-medium">Estado</TableHead>
              <TableHead className="w-[15%] text-right font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                  No se encontraron usuarios que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="default">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {getInitials(usuario.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {usuario.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {usuario.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <UsuarioRolEditor
                      usuario={usuario}
                      sucursales={sucursales}
                      onGuardado={onReload}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        usuario.isActive
                          ? "gap-1.5 border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "gap-1.5 border-destructive/25 bg-destructive/10 text-destructive"
                      }
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          usuario.isActive ? "bg-emerald-600 dark:bg-emerald-400" : "bg-destructive"
                        }`}
                      />
                      {usuario.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={usuario.isActive ? "outline" : "default"}
                      disabled={isToggling}
                      className="h-8 text-xs gap-1.5"
                      onClick={() => onToggleEstado(usuario.id, usuario.isActive)}
                    >
                      {usuario.isActive ? (
                        <>
                          <UserMinus className="size-3.5 text-muted-foreground" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <UserCheck className="size-3.5" />
                          Activar
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
