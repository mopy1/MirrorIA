import { useState } from "react"
import { Plus, Trash } from "@phosphor-icons/react"
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
import { useVariantesConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import type { CreateOrdenCompraItemDto } from "../../types/purchase-orders.types"

interface OrdenItemsSelectorProps {
  items: CreateOrdenCompraItemDto[]
  onChange: (items: CreateOrdenCompraItemDto[]) => void
}

export function OrdenItemsSelector({ items, onChange }: OrdenItemsSelectorProps) {
  const { variantes } = useVariantesConProducto()
  const [varianteId, setVarianteId] = useState("")
  const [cantidad, setCantidad] = useState("1")

  function handleAdd() {
    const qty = parseInt(cantidad, 10)
    if (!varianteId || isNaN(qty) || qty <= 0) return
    const existing = items.find((i) => i.varianteId === varianteId)
    if (existing) {
      onChange(
        items.map((i) =>
          i.varianteId === varianteId ? { ...i, cantidadPedida: i.cantidadPedida + qty } : i
        )
      )
    } else {
      onChange([...items, { varianteId, cantidadPedida: qty }])
    }
    setVarianteId("")
    setCantidad("1")
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium text-foreground">Prendas a solicitar</span>
      <div className="flex gap-2">
        <Select value={varianteId} onValueChange={(v) => setVarianteId(v ?? "")}>
          <SelectTrigger className="flex-1 text-xs">
            <SelectValue placeholder="Seleccionar variante">
              {(id: string) => {
                const v = variantes.find((it) => it.varianteId === id)
                return v
                  ? `${v.productoTitulo} · ${v.tallaNombre}/${v.colorNombre}`
                  : "Seleccionar variante"
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="text-xs shrink-0"
        >
          <Plus data-icon="inline-start" />
          Agregar
        </Button>
      </div>

      {items.length > 0 && (
        <div className="border rounded-md divide-y max-h-36 overflow-y-auto">
          {items.map((item) => {
            const v = variantes.find((it) => it.varianteId === item.varianteId)
            const nombre = v
              ? `${v.productoTitulo} (${v.tallaNombre}/${v.colorNombre})`
              : item.varianteId.slice(0, 8)
            return (
              <div key={item.varianteId} className="flex items-center justify-between p-2 text-xs">
                <span className="truncate max-w-[240px]">{nombre}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{item.cantidadPedida} u.</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onChange(items.filter((i) => i.varianteId !== item.varianteId))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
