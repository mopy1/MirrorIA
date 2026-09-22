import { useState, type FormEvent } from "react"
import { Plus, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { catalogApi } from "@/features/catalog/api/catalogApi"
import type { Categoria, Coleccion } from "@/features/catalog/types/catalog.types"
import { useCreateResource } from "@/hooks/useCreateResource"
import { ProductoFormFields, type ProductoFormData } from "./producto-form-fields"
import { construirPayloadProducto } from "./producto-payload"

interface CrearProductoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categorias: Categoria[]
  colecciones: Coleccion[]
  onCreated: () => void
}

const FORM_INICIAL: ProductoFormData = {
  categoriaId: "",
  coleccionId: "",
  titulo: "",
  slug: "",
  descripcion: "",
  precio: "",
  imagenUrl: "",
  arOverlayImageUrl: "",
  modeloArUrl: "",
}

export function CrearProductoDialog({
  open,
  onOpenChange,
  categorias,
  colecciones,
  onCreated,
}: CrearProductoDialogProps) {
  const { submit, isLoading, error } = useCreateResource(catalogApi.createProducto)
  const [form, setForm] = useState<ProductoFormData>(FORM_INICIAL)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await submit(construirPayloadProducto(form))
    if (result) {
      onCreated()
      setForm(FORM_INICIAL)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
          <DialogDescription>
            Registra una nueva prenda en el catálogo para su venta online y física.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
          <ProductoFormFields
            form={form}
            setForm={setForm}
            categorias={categorias}
            colecciones={colecciones}
          />

          {error && (
            <Alert variant="destructive" className="py-2 text-xs">
              <WarningCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-1.5">
              <Plus className="size-3.5" />
              {isLoading ? "Creando..." : "Crear prenda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
