import { ShieldCheck } from "@phosphor-icons/react"
import type { ItemDiagnosticoAnomalia } from "../../types/ml.types"
import { MlAnomaliasItem } from "./ml-anomalias-item"

interface MlAnomaliasFeedProps {
  diagnosticos?: ItemDiagnosticoAnomalia[]
}

/** Feed cronológico de transacciones analizadas con score de aislamiento (Liu 2008). */
export function MlAnomaliasFeed({ diagnosticos = [] }: MlAnomaliasFeedProps) {
  if (diagnosticos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
        <ShieldCheck className="size-6 text-emerald-500 mb-1" weight="duotone" />
        <span>No se detectaron irregularidades ni transacciones anómalas en caja.</span>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {diagnosticos.map((diag) => (
        <MlAnomaliasItem key={diag.venta_id} diagnostico={diag} />
      ))}
    </div>
  )
}
