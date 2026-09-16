import { catalogApi } from "@/features/catalog/api/catalogApi"
import { providersApi } from "@/features/providers/api/providersApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"
import { SimpleResourceManager } from "../simple-resource-manager"

export function ColeccionesPanel() {
  const list = useResourceList(catalogApi.getColecciones)
  const temporadas = useResourceList(catalogApi.getTemporadas)
  const proveedores = useResourceList(providersApi.getProveedores)
  const { submit, isLoading, error } = useCreateResource(catalogApi.createColeccion)

  return (
    <SimpleResourceManager
      title="Colecciones"
      createButtonLabel="Nueva colección"
      items={list.items}
      isLoading={list.isLoading || temporadas.isLoading || proveedores.isLoading}
      error={list.error}
      isCreating={isLoading}
      createError={error}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "descripcion", label: "Descripción", render: (c) => c.descripcion ?? "—" },
      ]}
      fields={[
        { name: "nombre", label: "Nombre", required: true },
        { name: "descripcion", label: "Descripción", type: "textarea" },
        {
          name: "temporadaId",
          label: "Temporada",
          type: "select",
          required: true,
          options: temporadas.items.map((t) => ({ value: t.id, label: t.nombre })),
        },
        {
          name: "proveedorId",
          label: "Proveedor",
          type: "select",
          required: true,
          options: proveedores.items.map((p) => ({ value: p.id, label: p.razonSocial })),
        },
      ]}
      onCreate={async (values) => {
        const result = await submit({
          nombre: values.nombre,
          descripcion: values.descripcion || undefined,
          temporadaId: values.temporadaId,
          proveedorId: values.proveedorId,
        })
        if (result) list.reload()
        return Boolean(result)
      }}
    />
  )
}
