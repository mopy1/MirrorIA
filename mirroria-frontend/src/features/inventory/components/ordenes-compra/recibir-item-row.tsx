import { Input } from "@/components/ui/input"
import type { VarianteConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import type { OrdenCompraItem } from "../../types/purchase-orders.types"

interface Props {
  item: OrdenCompraItem
  variantes: VarianteConProducto[]
  cantidad: number
  onChangeCantidad: (varianteId: string, cantidad: number) => void
}

export function RecibirItemRow({ item, variantes, cantidad, onChangeCantidad }: Props) {
  const v = variantes.find((it) => it.varianteId === item.varianteId)
  const titulo = v ? `${v.productoTitulo} (${v.tallaNombre} / ${v.colorNombre})` : item.varianteId.slice(0, 8)
  const pendiente = Math.max(0, item.cantidadPedida - item.cantidadRecibida)

  return (
    <div className="p-3 flex items-center justify-between gap-3 text-xs">
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{titulo}</p>
        <p className="text-muted-foreground text-[11px]">
          Pedidas: {item.cantidadPedida} · Recibidas: {item.cantidadRecibida} · Pendiente: {pendiente}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Input
          type="number"
          min={0}
          max={pendiente}
          value={cantidad}
          onChange={(e) => onChangeCantidad(item.varianteId, Math.max(0, parseInt(e.target.value, 10) || 0))}
          className="w-16 h-8 text-xs text-right"
        />
        <span className="text-muted-foreground">u.</span>
      </div>
    </div>
  )
}
