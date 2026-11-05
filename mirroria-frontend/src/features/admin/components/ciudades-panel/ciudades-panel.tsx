import { Info, MapPin, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { branchesApi } from "@/features/branches/api/branchesApi"
import { useResourceList } from "@/hooks/useResourceList"
import { ResourceTable } from "../simple-resource-manager/resource-table"

/**
 * Ciudades GLOBALES (spec D5): las administra la plataforma, la tienda solo
 * las elige al abrir una sucursal. Por eso acá ya no hay "Nueva ciudad".
 */
export function CiudadesPanel() {
  const list = useResourceList(branchesApi.getCiudades)

  return (
    <div className="space-y-4">
      <Alert>
        <Info />
        <AlertDescription>
          Estas son las ciudades habilitadas en MirrorIA para tus sucursales. ¿Falta tu ciudad?{" "}
          <a href="mailto:soporte@mirroria.app?subject=Nueva%20ciudad" className="font-medium text-primary underline-offset-4 hover:underline">
            Escribinos
          </a>
        </AlertDescription>
      </Alert>
      {list.error && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      )}
      <ResourceTable
        items={list.items}
        isLoading={list.isLoading}
        search=""
        columns={[
          {
            key: "nombre",
            label: "Ciudad",
            render: (c) => (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="text-sm font-medium text-foreground">{c.nombre}</span>
              </div>
            ),
          },
          {
            key: "pais",
            label: "País",
            render: (c) => (
              <Badge variant="outline" className="text-xs font-normal">
                {c.pais}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  )
}
