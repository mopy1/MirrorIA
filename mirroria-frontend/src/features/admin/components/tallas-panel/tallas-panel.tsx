import { catalogApi } from "@/features/catalog/api/catalogApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"
import { SimpleResourceManager } from "../simple-resource-manager"

export function TallasPanel() {
  const list = useResourceList(catalogApi.getTallas)
  const { submit, isLoading, error } = useCreateResource(catalogApi.createTalla)

  return (
    <SimpleResourceManager
      title="Tallas"
      createButtonLabel="Nueva talla"
      items={list.items}
      isLoading={list.isLoading}
      error={list.error}
      isCreating={isLoading}
      createError={error}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "orden", label: "Orden" },
      ]}
      fields={[
        { name: "nombre", label: "Nombre (ej. M)", required: true },
        { name: "orden", label: "Orden (opcional)", type: "number" },
      ]}
      onCreate={async (values) => {
        const result = await submit({
          nombre: values.nombre,
          orden: values.orden ? Number(values.orden) : undefined,
        })
        if (result) list.reload()
        return Boolean(result)
      }}
    />
  )
}
