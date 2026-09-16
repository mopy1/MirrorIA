import { EnvelopeSimple, Phone, Truck } from "@phosphor-icons/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SimpleResourceManager } from "@/features/admin/components/simple-resource-manager"
import { providersApi } from "@/features/providers/api/providersApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function ProveedoresAdminPage() {
  const list = useResourceList(providersApi.getProveedores)
  const { submit, isLoading, error } = useCreateResource(providersApi.createProveedor)

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de fabricantes y distribuidores de prendas y accesorios.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-normal w-fit">
          <Truck className="size-3.5 text-muted-foreground" />
          <span>{list.items.length} proveedores</span>
        </Badge>
      </div>

      <SimpleResourceManager
        title="Proveedores"
        createButtonLabel="Nuevo proveedor"
        items={list.items}
        isLoading={list.isLoading}
        error={list.error}
        isCreating={isLoading}
        createError={error}
        columns={[
          {
            key: "razonSocial",
            label: "Proveedor y Razón Social",
            render: (p) => (
              <div className="flex items-center gap-3">
                <Avatar size="default">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                    {getInitials(p.razonSocial)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{p.razonSocial}</p>
                  {p.contactoNombre && (
                    <p className="text-xs text-muted-foreground truncate">{p.contactoNombre}</p>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "nit",
            label: "NIT",
            render: (p) => (
              <Badge variant="outline" className="font-mono text-xs font-normal">
                {p.nit ?? "Sin NIT"}
              </Badge>
            ),
          },
          {
            key: "contactoEmail",
            label: "Email de contacto",
            render: (p) =>
              p.contactoEmail ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <EnvelopeSimple className="size-3.5 shrink-0" />
                  <span className="truncate">{p.contactoEmail}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
          {
            key: "contactoTelefono",
            label: "Teléfono",
            render: (p) =>
              p.contactoTelefono ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="size-3.5 shrink-0" />
                  <span>{p.contactoTelefono}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
        ]}
        fields={[
          { name: "razonSocial", label: "Razón social", required: true },
          { name: "nit", label: "NIT" },
          { name: "contactoNombre", label: "Nombre de contacto" },
          { name: "contactoEmail", label: "Email de contacto" },
          { name: "contactoTelefono", label: "Teléfono de contacto" },
        ]}
        onCreate={async (values) => {
          const result = await submit({
            razonSocial: values.razonSocial,
            nit: values.nit || undefined,
            contactoNombre: values.contactoNombre || undefined,
            contactoEmail: values.contactoEmail || undefined,
            contactoTelefono: values.contactoTelefono || undefined,
          })
          if (result) list.reload()
          return Boolean(result)
        }}
      />
    </div>
  )
}
