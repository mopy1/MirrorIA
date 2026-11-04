import { useMemo, useState } from "react"
import { Truck } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { proveedoresColumns } from "@/features/admin/components/proveedores-columns"
import { SimpleResourceManager } from "@/features/admin/components/simple-resource-manager"
import { branchesApi } from "@/features/branches/api/branchesApi"
import { purchaseOrdersApi } from "@/features/inventory/api/purchaseOrdersApi"
import { CrearOrdenCompraDialog } from "@/features/inventory/components/ordenes-compra"
import { resumenPorProveedor } from "@/features/inventory/lib/resumen-ordenes"
import { providersApi } from "@/features/providers/api/providersApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"

export function ProveedoresAdminPage() {
  const list = useResourceList(providersApi.getProveedores)
  const { submit, isLoading, error } = useCreateResource(providersApi.createProveedor)
  const ordenes = useResourceList(purchaseOrdersApi.getOrdenes)
  const sucursales = useResourceList(branchesApi.getSucursales)
  const resumen = useMemo(() => resumenPorProveedor(ordenes.items), [ordenes.items])
  const [proveedorParaOrden, setProveedorParaOrden] = useState<string | null>(null)

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
        columns={proveedoresColumns({ resumen, onNuevaOrden: (p) => setProveedorParaOrden(p.id) })}
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

      <CrearOrdenCompraDialog
        open={Boolean(proveedorParaOrden)}
        onOpenChange={(open) => !open && setProveedorParaOrden(null)}
        proveedores={list.items}
        sucursales={sucursales.items}
        initialProveedorId={proveedorParaOrden ?? undefined}
        onSuccess={ordenes.reload}
      />
    </div>
  )
}
