import { catalogApi } from "@/features/catalog/api/catalogApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"
import { SimpleResourceManager } from "../simple-resource-manager"

export function TemporadasPanel() {
  const list = useResourceList(catalogApi.getTemporadas)
  const { submit, isLoading, error } = useCreateResource(catalogApi.createTemporada)

  return (
    <SimpleResourceManager
      title="Temporadas"
      createButtonLabel="Nueva temporada"
      items={list.items}
      isLoading={list.isLoading}
      error={list.error}
      isCreating={isLoading}
      createError={error}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "fechaInicio", label: "Desde" },
        { key: "fechaFin", label: "Hasta" },
      ]}
      fields={[
        { name: "nombre", label: "Nombre", required: true },
        { name: "fechaInicio", label: "Fecha de inicio", type: "date", required: true },
        { name: "fechaFin", label: "Fecha de fin", type: "date", required: true },
      ]}
      onCreate={async (values) => {
        const result = await submit({
          nombre: values.nombre,
          fechaInicio: values.fechaInicio,
          fechaFin: values.fechaFin,
        })
        if (result) list.reload()
        return Boolean(result)
      }}
    />
  )
}
