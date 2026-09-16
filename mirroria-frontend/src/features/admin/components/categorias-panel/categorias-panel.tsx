import { catalogApi } from "@/features/catalog/api/catalogApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"
import { SimpleResourceManager } from "../simple-resource-manager"

export function CategoriasPanel() {
  const list = useResourceList(catalogApi.getCategorias)
  const { submit, isLoading, error } = useCreateResource(catalogApi.createCategoria)

  return (
    <SimpleResourceManager
      title="Categorías"
      createButtonLabel="Nueva categoría"
      items={list.items}
      isLoading={list.isLoading}
      error={list.error}
      isCreating={isLoading}
      createError={error}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "slug", label: "Slug" },
        { key: "activo", label: "Activa", render: (c) => (c.activo ? "Sí" : "No") },
      ]}
      fields={[
        { name: "nombre", label: "Nombre", required: true },
        { name: "slug", label: "Slug", required: true },
      ]}
      onCreate={async (values) => {
        const result = await submit({ nombre: values.nombre, slug: values.slug })
        if (result) list.reload()
        return Boolean(result)
      }}
    />
  )
}
