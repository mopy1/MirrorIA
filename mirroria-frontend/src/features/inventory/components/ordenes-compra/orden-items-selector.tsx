import { useState } from "react"
import { Plus } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { VarianteConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import type { CreateOrdenCompraItemDto } from "../../types/purchase-orders.types"
import { OrdenItemsList } from "./orden-items-list"

interface OrdenItemsSelectorProps {
  items: CreateOrdenCompraItemDto[]
  onChange: (items: CreateOrdenCompraItemDto[]) => void
  /** Solo las prendas del proveedor elegido (colección → proveedor). */
  variantes: VarianteConProducto[]
  hayProveedor: boolean
  initialVarianteId?: string
}

export function OrdenItemsSelector({
  items,
  onChange,
  variantes,
  hayProveedor,
  initialVarianteId,
}: OrdenItemsSelectorProps) {
  const [varianteId, setVarianteId] = useState(initialVarianteId ?? "")
  const [cantidad, setCantidad] = useState("1")

  function handleAdd() {
    const qty = parseInt(cantidad, 10)
    if (!varianteId || isNaN(qty) || qty <= 0) return
    // Una variante = una línea: repetirla se suma (el backend rechaza duplicadas).
    const existe = items.some((i) => i.varianteId === varianteId)
    onChange(
      existe
        ? items.map((i) => (i.varianteId === varianteId ? { ...i, cantidadPedida: i.cantidadPedida + qty } : i))
        : [...items, { varianteId, cantidadPedida: qty }]
    )
    setVarianteId("")
    setCantidad("1")
  }

  const placeholder = !hayProveedor
    ? "Elegí un proveedor primero"
    : variantes.length === 0
      ? "Sin prendas"
      : "Seleccionar variante"

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium text-foreground">Prendas a solicitar</span>
      {hayProveedor && variantes.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Este proveedor no tiene prendas en el catálogo: asigná sus colecciones en Catálogo.
        </p>
      )}
      <div className="flex gap-2">
        <Select value={varianteId} onValueChange={(v) => setVarianteId(v ?? "")} disabled={variantes.length === 0}>
          <SelectTrigger className="flex-1 min-w-0 text-xs">
            <SelectValue placeholder={placeholder}>
              {(id: string) => {
                const v = variantes.find((it) => it.varianteId === id)
                return v ? `${v.productoTitulo} · ${v.tallaNombre}/${v.colorNombre}` : placeholder
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {variantes.map((v) => (
                <SelectItem key={v.varianteId} value={v.varianteId} className="text-xs">
                  {v.productoTitulo} · {v.tallaNombre} / {v.colorNombre} ({v.sku})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          type="number"
          min="1"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-20 text-xs"
          placeholder="Cant."
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={!varianteId} className="text-xs shrink-0">
          <Plus data-icon="inline-start" />
          Agregar
        </Button>
      </div>
      <OrdenItemsList
        items={items}
        variantes={variantes}
        onRemove={(id) => onChange(items.filter((i) => i.varianteId !== id))}
      />
    </div>
  )
}
