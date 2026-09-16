import { catalogApi } from "@/features/catalog/api/catalogApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"
import { SimpleResourceManager } from "../simple-resource-manager"

export function ColoresPanel() {
  const list = useResourceList(catalogApi.getColores)
  const { submit, isLoading, error } = useCreateResource(catalogApi.createColor)

  return (
    <SimpleResourceManager
      title="Colores"
      createButtonLabel="Nuevo color"
      items={list.items}
      isLoading={list.isLoading}
      error={list.error}
      isCreating={isLoading}
      createError={error}
      columns={[
        { key: "nombre", label: "Nombre" },
        {
          key: "hexCode",
          label: "Color",
          render: (c) =>
            c.hexCode ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block size-4 rounded-full border border-border"
                  style={{ backgroundColor: c.hexCode }}
                />
                {c.hexCode}
              </span>
            ) : (
              "—"
            ),
        },
      ]}
      fields={[
        { name: "nombre", label: "Nombre", required: true },
        { name: "hexCode", label: "Código hex (ej. #FF0000)" },
      ]}
      onCreate={async (values) => {
        const result = await submit({
          nombre: values.nombre,
          hexCode: values.hexCode || undefined,
        })
        if (result) list.reload()
        return Boolean(result)
      }}
    />
  )
}
