import { MapPin } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { branchesApi } from "@/features/branches/api/branchesApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"
import { SimpleResourceManager } from "../simple-resource-manager"

export function CiudadesPanel() {
  const list = useResourceList(branchesApi.getCiudades)
  const { submit, isLoading, error } = useCreateResource(branchesApi.createCiudad)

  return (
    <SimpleResourceManager
      title="Ciudades"
      createButtonLabel="Nueva ciudad"
      items={list.items}
      isLoading={list.isLoading}
      error={list.error}
      isCreating={isLoading}
      createError={error}
      columns={[
        {
          key: "nombre",
          label: "Ciudad",
          render: (c) => (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary shrink-0" />
              <span className="font-medium text-sm text-foreground">{c.nombre}</span>
            </div>
          ),
        },
        {
          key: "pais",
          label: "País",
          render: (c) => (
            <Badge variant="outline" className="font-normal text-xs">
              {c.pais}
            </Badge>
          ),
        },
      ]}
      fields={[
        { name: "nombre", label: "Nombre", required: true },
        { name: "pais", label: "País", required: true },
      ]}
      onCreate={async (values) => {
        const result = await submit({ nombre: values.nombre, pais: values.pais })
        if (result) list.reload()
        return Boolean(result)
      }}
    />
  )
}
