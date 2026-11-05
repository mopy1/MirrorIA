import { useAccionesInquilino } from "../hooks/useAccionesInquilino"
import type { InquilinoResumenDto } from "../types/plataforma.types"
import { ExtenderDialog } from "./extender-dialog"

/** "Extender" desde una fila (dashboard): mismo diálogo y endpoint que el detalle. */
export function ExtenderRapido({ tienda, onCerrar, onListo }: { tienda: InquilinoResumenDto | null; onCerrar: () => void; onListo: () => void }) {
  const acciones = useAccionesInquilino(tienda?.id ?? "", onListo)
  return (
    <ExtenderDialog
      key={tienda?.id ?? "nada"}
      open={tienda !== null}
      onOpenChange={(o) => !o && onCerrar()}
      isLoading={acciones.enCurso === "extender"}
      error={acciones.errorDe("extender")}
      onConfirmar={acciones.extender}
    />
  )
}
