import { useState, useMemo } from "react"
import { ShieldCheck } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { ItemDiagnosticoAnomalia } from "../../types/ml.types"
import { MlAnomaliasItem } from "./ml-anomalias-item"

interface MlAnomaliasFeedProps {
  diagnosticos?: ItemDiagnosticoAnomalia[]
}

/** Feed interactivo de transacciones analizadas con filtro para el Gerente Comercial. */
export function MlAnomaliasFeed({ diagnosticos = [] }: MlAnomaliasFeedProps) {
  const [filtro, setFiltro] = useState<"todas" | "sospechosas">("todas")

  const sospechosas = useMemo(
    () => diagnosticos.filter((d) => d.es_anomalo || d.nivel_riesgo !== "NORMAL"),
    [diagnosticos],
  )

  const itemsAMostrar = filtro === "sospechosas" ? sospechosas : diagnosticos

  if (diagnosticos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
        <ShieldCheck className="size-6 text-emerald-500 mb-1" weight="duotone" />
        <span>No se detectaron irregularidades ni transacciones anómalas en caja.</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={filtro === "todas" ? "default" : "outline"}
            className="h-7 text-[11px] px-2.5"
            onClick={() => setFiltro("todas")}
          >
            Todas ({diagnosticos.length})
          </Button>
          <Button
            size="sm"
            variant={filtro === "sospechosas" ? "default" : "outline"}
            className="h-7 text-[11px] px-2.5"
            onClick={() => setFiltro("sospechosas")}
          >
            Solo Sospechosas ({sospechosas.length})
          </Button>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {itemsAMostrar.length} {itemsAMostrar.length === 1 ? "ticket" : "tickets"}
        </span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {itemsAMostrar.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No hay tickets en esta categoría.
          </div>
        ) : (
          itemsAMostrar.map((diag) => (
            <MlAnomaliasItem key={diag.venta_id} diagnostico={diag} />
          ))
        )}
      </div>
    </div>
  )
}
