import type { Dispatch, SetStateAction } from "react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Categoria, Coleccion } from "@/features/catalog/types/catalog.types"

export interface ProductoFormData {
  categoriaId: string
  coleccionId: string
  titulo: string
  slug: string
  descripcion: string
  precio: string
  imagenUrl: string
  arOverlayImageUrl: string
}

interface ProductoFormFieldsProps {
  form: ProductoFormData
  setForm: Dispatch<SetStateAction<ProductoFormData>>
  categorias: Categoria[]
  colecciones: Coleccion[]
}

export function ProductoFormFields({
  form,
  setForm,
  categorias,
  colecciones,
}: ProductoFormFieldsProps) {
  return (
    <FieldGroup className="gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>Categoría *</FieldLabel>
          <Select
            value={form.categoriaId}
            onValueChange={(v) => setForm((f) => ({ ...f, categoriaId: v as string }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar">
                {(id: string) => categorias.find((c) => c.id === id)?.nombre ?? "Seleccionar"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Colección *</FieldLabel>
          <Select
            value={form.coleccionId}
            onValueChange={(v) => setForm((f) => ({ ...f, coleccionId: v as string }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar">
                {(id: string) => colecciones.find((c) => c.id === id)?.nombre ?? "Seleccionar"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {colecciones.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="titulo">Título de prenda *</FieldLabel>
          <Input
            id="titulo"
            required
            placeholder="Ej. Vestido Gala Seda"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="slug">Slug (identificador web) *</FieldLabel>
          <Input
            id="slug"
            required
            placeholder="ej-vestido-gala-seda"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="descripcion">Descripción de producto</FieldLabel>
        <Textarea
          id="descripcion"
          placeholder="Detalles sobre tela, corte y estilo..."
          value={form.descripcion}
          onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="precio">Precio de venta (Bs) *</FieldLabel>
          <Input
            id="precio"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="Ej. 180"
            value={form.precio}
            onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="imagenUrl">URL de foto de prenda</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              id="imagenUrl"
              placeholder="https://... URL de imagen"
              value={form.imagenUrl}
              onChange={(e) => setForm((f) => ({ ...f, imagenUrl: e.target.value }))}
            />
            {form.imagenUrl ? (
              <img
                src={form.imagenUrl}
                alt="Previa"
                referrerPolicy="no-referrer"
                className="size-9 rounded-md object-cover border shrink-0 bg-muted"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = "none"
                }}
              />
            ) : null}
          </div>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="arOverlayImageUrl">
          Imagen para Vestidor AR (PNG fondo transparente)
        </FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            id="arOverlayImageUrl"
            placeholder="https://... PNG con fondo transparente"
            value={form.arOverlayImageUrl}
            onChange={(e) => setForm((f) => ({ ...f, arOverlayImageUrl: e.target.value }))}
          />
          {form.arOverlayImageUrl ? (
            <img
              src={form.arOverlayImageUrl}
              alt="Previa AR"
              referrerPolicy="no-referrer"
              className="size-9 rounded-md object-contain border shrink-0 bg-muted"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = "none"
              }}
            />
          ) : null}
        </div>
      </Field>
    </FieldGroup>
  )
}
