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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { catalogApi } from "@/features/catalog/api/catalogApi"
import type { Producto } from "@/features/catalog/types/catalog.types"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"

interface AgregarVarianteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productos: Producto[]
  productoInicialId?: string
  onVarianteCreada: () => void
}

export function AgregarVarianteDialog({
  open,
  onOpenChange,
  productos,
  productoInicialId,
  onVarianteCreada,
}: AgregarVarianteDialogProps) {
  const tallas = useResourceList(catalogApi.getTallas)
  const colores = useResourceList(catalogApi.getColores)
  const [productoId, setProductoId] = useState(productoInicialId ?? "")
  const [tallaId, setTallaId] = useState("")
  const [colorId, setColorId] = useState("")
  const [sku, setSku] = useState("")

  const effectiveId = productoId || productoInicialId || ""

  const { submit, isLoading, error } = useCreateResource(
    (dto: { tallaId: string; colorId: string; sku: string }) =>
      catalogApi.createVariante(effectiveId, dto)
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const ok = await submit({ tallaId, colorId, sku })
    if (ok) {
      onVarianteCreada()
      setTallaId("")
      setColorId("")
      setSku("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva variante de prenda</DialogTitle>
          <DialogDescription>Asigna combinación de talla, color y SKU.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-1">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel>Prenda asociada *</FieldLabel>
              <Select value={effectiveId} onValueChange={(v) => setProductoId(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegí un producto">
                    {(id: string) => productos.find((p) => p.id === id)?.titulo ?? "Elegí un producto"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {productos.map((p) => (<SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="sku">SKU único *</FieldLabel>
              <Input
                id="sku"
                required
                placeholder="Ej. VEST-ROJO-M"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Talla *</FieldLabel>
                <Select value={tallaId} onValueChange={(v) => setTallaId(v as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Talla">
                      {(id: string) => tallas.items.find((t) => t.id === id)?.nombre ?? "Talla"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {tallas.items.map((t) => (<SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Color *</FieldLabel>
                <Select value={colorId} onValueChange={(v) => setColorId(v as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Color">
                      {(id: string) => colores.items.find((c) => c.id === id)?.nombre ?? "Color"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {colores.items.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>

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
              {isLoading ? "Guardando..." : "Guardar variante"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
