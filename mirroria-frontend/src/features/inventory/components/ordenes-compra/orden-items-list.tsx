import { Trash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { VarianteConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import type { CreateOrdenCompraItemDto } from "../../types/purchase-orders.types"

interface Props {
  items: CreateOrdenCompraItemDto[]
  variantes: VarianteConProducto[]
  onRemove: (varianteId: string) => void
}

export function OrdenItemsList({ items, variantes, onRemove }: Props) {
  if (items.length === 0) return null
  return (
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
                aria-label="Quitar prenda"
                onClick={() => onRemove(item.varianteId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
