import { MapPin, Phone, Storefront } from "@phosphor-icons/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { branchesApi } from "@/features/branches/api/branchesApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"
import { SimpleResourceManager } from "../simple-resource-manager"

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function SucursalesPanel() {
  const list = useResourceList(branchesApi.getSucursales)
  const ciudades = useResourceList(branchesApi.getCiudades)
  const { submit, isLoading, error } = useCreateResource(branchesApi.createSucursal)

  return (
    <SimpleResourceManager
      title="Sucursales"
      createButtonLabel="Nueva sucursal"
      items={list.items}
      isLoading={list.isLoading || ciudades.isLoading}
      error={list.error}
      isCreating={isLoading}
      createError={error}
      columns={[
        {
          key: "nombre",
          label: "Tienda y Sucursal",
          render: (s) => (
            <div className="flex items-center gap-3">
              <Avatar size="default">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {getInitials(s.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{s.nombre}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <Storefront className="size-3 shrink-0" />
                  <span>Tienda física</span>
                </div>
              </div>
            </div>
          ),
        },
        {
          key: "ciudadNombre",
          label: "Ciudad",
          render: (s) => (
            <Badge variant="secondary" className="gap-1 text-xs font-normal">
              <MapPin className="size-3 text-muted-foreground" />
              <span>{s.ciudadNombre}</span>
            </Badge>
          ),
        },
        {
          key: "direccion",
          label: "Dirección",
          render: (s) => (
            <span className="text-xs text-muted-foreground line-clamp-1">{s.direccion}</span>
          ),
        },
        {
          key: "telefono",
          label: "Teléfono",
          render: (s) =>
            s.telefono ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="size-3.5 shrink-0" />
                <span>{s.telefono}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            ),
        },
      ]}
      fields={[
        {
          name: "ciudadId",
          label: "Ciudad",
          type: "select",
          required: true,
          options: ciudades.items.map((c) => ({ value: c.id, label: c.nombre })),
        },
        { name: "nombre", label: "Nombre", required: true },
        { name: "direccion", label: "Dirección", required: true },
        { name: "telefono", label: "Teléfono" },
      ]}
      onCreate={async (values) => {
        const result = await submit({
          ciudadId: values.ciudadId,
          nombre: values.nombre,
          direccion: values.direccion,
          telefono: values.telefono || undefined,
        })
        if (result) list.reload()
        return Boolean(result)
      }}
    />
  )
}
