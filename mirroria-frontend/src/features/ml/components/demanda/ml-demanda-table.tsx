import { ShoppingCart, Check } from "@phosphor-icons/react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatearNombrePrenda } from "../../lib/ml.utils"
import type { ItemPrediccionDemanda, RiesgoQuiebre } from "../../types/ml.types"

const BADGE_MAP: Record<RiesgoQuiebre, { cls: string; label: string }> = {
  CRITICO: { cls: "bg-rose-500/15 text-rose-600 border-rose-500/30", label: "Crítico" },
  ALTO: { cls: "bg-amber-500/15 text-amber-600 border-amber-500/30", label: "Alto" },
  MEDIO: { cls: "bg-blue-500/15 text-blue-600 border-blue-500/30", label: "Medio" },
  BAJO: { cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", label: "Bajo" },
}

interface MlDemandaTableProps {
  items: ItemPrediccionDemanda[]
}

/** Tabla operativa de reabastecimiento con sugerencias de compra directas. */
export function MlDemandaTable({ items }: MlDemandaTableProps) {
  const [pedidoIds, setPedidoIds] = useState<Record<string, boolean>>({})

  function pedir(id: string) {
    setPedidoIds((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setPedidoIds((prev) => ({ ...prev, [id]: false }))
    }, 2500)
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border/60">
          <tr>
            <th className="py-2.5 px-3">Prenda</th>
            <th className="py-2.5 px-3 text-center">Stock</th>
            <th className="py-2.5 px-3 text-center">Demanda prevista</th>
            <th className="py-2.5 px-3 text-center">Riesgo</th>
            <th className="py-2.5 px-3 text-right">Sugerencia</th>
            <th className="py-2.5 px-3 text-center">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {items.slice(0, 5).map((p) => {
            const cfg = BADGE_MAP[p.riesgo_quiebre] ?? BADGE_MAP.BAJO
            const pedido = pedidoIds[p.producto_id]

            return (
              <tr key={p.producto_id} className="transition-colors hover:bg-muted/20">
                <td className="py-2.5 px-3 font-medium text-foreground">
                  <div className="truncate max-w-[180px]">{formatearNombrePrenda(p.producto_id, p.nombre)}</div>
                  <span className="text-[10px] text-muted-foreground font-mono">{p.categoria || p.producto_id}</span>
                </td>
                <td className="py-2.5 px-3 text-center font-mono">{p.stock_actual}</td>
                <td className="py-2.5 px-3 text-center font-mono font-semibold">{Math.round(p.demanda_proyectada_unidades)}</td>
                <td className="py-2.5 px-3 text-center">
                  <Badge variant="outline" className={`text-[10px] font-mono ${cfg.cls}`}>
                    {cfg.label}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-primary">
                  +{p.reabastecimiento_sugerido} uds
                </td>
                <td className="py-2.5 px-3 text-center">
                  <Button
                    size="xs"
                    variant={pedido ? "default" : "outline"}
                    onClick={() => pedir(p.producto_id)}
                    className="h-7 gap-1 text-[11px] shadow-xs cursor-pointer"
                  >
                    {pedido ? (
                      <>
                        <Check className="size-3 text-emerald-400" weight="bold" />
                        <span>Solicitado</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="size-3" />
                        <span>Pedir</span>
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
