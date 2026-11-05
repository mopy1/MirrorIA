import { useState, type FormEvent } from "react"
import { CircleNotch, Plus } from "@phosphor-icons/react"
import { ErrorConPlan } from "@/components/common/ErrorConPlan"
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
    const precioCents = Math.round(Number(form.precio) * 100)
    const imagenes = form.imagenUrl.trim()
      ? [{ url: form.imagenUrl.trim(), orden: 0 }]
      : []
    const result = await submit({
      categoriaId: form.categoriaId,
      coleccionId: form.coleccionId,
      titulo: form.titulo,
      slug: form.slug,
      descripcion: form.descripcion || undefined,
      precioCents,
      imagenes,
    })
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

          <ErrorConPlan mensaje={error} />

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-1.5">
              {isLoading ? <CircleNotch className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              {isLoading ? "Creando..." : "Crear prenda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
