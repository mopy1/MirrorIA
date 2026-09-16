import { useMemo, useState } from "react"
import { MagnifyingGlass, Users, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { branchesApi } from "@/features/branches/api/branchesApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"
import { usuariosAdminApi } from "../api/usuariosAdminApi"
import { ROLES_CONFIG } from "../components/usuario-rol-editor"
import { UsuariosTable } from "../components/usuarios-table"

export function UsuariosAdminPage() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("TODOS")

  const usuarios = useResourceList(usuariosAdminApi.getUsuarios)
  const sucursales = useResourceList(branchesApi.getSucursales)
  const { submit: toggleEstado, isLoading: isToggling } = useCreateResource(
    (args: { id: string; isActive: boolean }) =>
      usuariosAdminApi.updateEstado(args.id, args.isActive)
  )

  async function handleToggleEstado(id: string, isActiveActual: boolean) {
    const result = await toggleEstado({ id, isActive: !isActiveActual })
    if (result) usuarios.reload()
  }

  const usuariosFiltrados = useMemo(() => {
    return usuarios.items.filter((u) => {
      const matchSearch =
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === "TODOS" || u.role === roleFilter
      return matchSearch && matchRole
    })
  }, [usuarios.items, search, roleFilter])

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de roles (RF02), asignación de sucursales y control de acceso.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-normal">
            <Users className="size-3.5 text-muted-foreground" />
            <span>{usuarios.items.length} usuarios</span>
          </Badge>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as string)}>
          <SelectTrigger className="w-full sm:w-56 h-10">
            <SelectValue placeholder="Filtrar por rol">
              {(v: string) => (v === "TODOS" ? "Todos los roles" : ROLES_CONFIG[v]?.label ?? v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los roles</SelectItem>
            {Object.entries(ROLES_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {usuarios.error && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertDescription>{usuarios.error}</AlertDescription>
        </Alert>
      )}

      {usuarios.isLoading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <UsuariosTable
          usuarios={usuariosFiltrados}
          sucursales={sucursales.items}
          isToggling={isToggling}
          onToggleEstado={handleToggleEstado}
          onReload={usuarios.reload}
        />
      )}
    </div>
  )
}
