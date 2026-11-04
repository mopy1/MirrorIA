import { useState, type FormEvent } from "react"
import { Check, WarningCircle } from "@phosphor-icons/react"
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
import type { Categoria, Coleccion, Producto } from "@/features/catalog/types/catalog.types"
import { ApiError } from "@/lib/api"
import { ProductoFormFields, type ProductoFormData } from "./producto-form-fields"

interface EditarProductoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: Producto | null
  categorias: Categoria[]
  colecciones: Coleccion[]
  onUpdated: () => void
}

function getInitialForm(producto: Producto | null): ProductoFormData {
  if (!producto) {
    return {
      categoriaId: "",
      coleccionId: "",
      titulo: "",
      slug: "",
      descripcion: "",
      precio: "",
      imagenUrl: "",
    }
  }
  return {
    categoriaId: producto.categoriaId ?? "",
    coleccionId: producto.coleccionId ?? "",
    titulo: producto.titulo ?? "",
    slug: producto.slug ?? "",
    descripcion: producto.descripcion ?? "",
    precio: producto.precioCents ? (producto.precioCents / 100).toString() : "",
    imagenUrl: producto.imagenes?.[0]?.url ?? "",
  }
}

export function EditarProductoDialog({
  open,
  onOpenChange,
  producto,
  categorias,
  colecciones,
  onUpdated,
}: EditarProductoDialogProps) {
  const [form, setForm] = useState<ProductoFormData>(() => getInitialForm(producto))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!producto) return

    setIsLoading(true)
    setError(null)
    try {
      const precioCents = Math.round(Number(form.precio) * 100)
      const imagenes = form.imagenUrl.trim()
        ? [{ url: form.imagenUrl.trim(), orden: 0, esArAsset: false }]
        : []
      await catalogApi.updateProducto(producto.id, {
        categoriaId: form.categoriaId,
        coleccionId: form.coleccionId,
        titulo: form.titulo,
        slug: form.slug,
        descripcion: form.descripcion || undefined,
        precioCents,
        imagenes,
      })
      onUpdated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar la prenda")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar prenda</DialogTitle>
          <DialogDescription>
            Modifica la información básica, categoría o precio de este producto.
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
              <Check className="size-3.5" />
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
