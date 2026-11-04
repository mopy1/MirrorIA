import { useState } from "react"
import { PencilSimple } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { catalogApi } from "@/features/catalog/api/catalogApi"
import type { Coleccion } from "@/features/catalog/types/catalog.types"
import { providersApi } from "@/features/providers/api/providersApi"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"
import { SimpleResourceManager } from "../simple-resource-manager"
import { EditarColeccionDialog } from "./editar-coleccion-dialog"

export function ColeccionesPanel() {
  const [editingColeccion, setEditingColeccion] = useState<Coleccion | null>(null)
  const list = useResourceList(catalogApi.getColecciones)
  const temporadas = useResourceList(catalogApi.getTemporadas)
  const proveedores = useResourceList(providersApi.getProveedores)
  const { submit, isLoading, error } = useCreateResource(catalogApi.createColeccion)

  return (
    <>
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
          {
            key: "temporada",
            label: "Temporada",
            render: (c) => temporadas.items.find((t) => t.id === c.temporadaId)?.nombre ?? "—",
          },
          {
            key: "proveedor",
            label: "Proveedor",
            render: (c) => {
              const prov = proveedores.items.find((p) => p.id === c.proveedorId)
              return prov ? (
                <span className="font-medium text-foreground">{prov.razonSocial}</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">Sin asignar</span>
              )
            },
          },
          {
            key: "acciones",
            label: "Acción",
            render: (c) => (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingColeccion(c)}
                >
                  <PencilSimple className="size-3.5" />
                  <span>Editar</span>
                </Button>
              </div>
            ),
          },
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

      <EditarColeccionDialog
        coleccion={editingColeccion}
        open={Boolean(editingColeccion)}
        onOpenChange={(open) => !open && setEditingColeccion(null)}
        temporadas={temporadas.items}
        proveedores={proveedores.items}
        onUpdated={() => {
          list.reload()
          setEditingColeccion(null)
        }}
      />
    </>
  )
}
