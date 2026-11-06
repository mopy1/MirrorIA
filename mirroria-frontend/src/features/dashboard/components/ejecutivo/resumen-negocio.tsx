import { useMemo } from "react"
import { ResumenNarrativo } from "@/components/common/resumen-narrativo"
import { armarAvisosNegocio, armarResumenNegocio } from "../../lib/resumen-negocio"
import type { DashboardEjecutivoDto } from "../../types/dashboard.types"

/** La conclusión del período en palabras + "Qué mirar" con acceso directo. */
export function ResumenNegocio({ data, isLoading }: { data?: DashboardEjecutivoDto | null; isLoading?: boolean }) {
  const contenido = useMemo(
    () => (data ? { resumen: armarResumenNegocio(data), avisos: armarAvisosNegocio(data) } : null),
    [data],
  )

  return (
    <ResumenNarrativo
      titulo="En pocas palabras"
      resumen={contenido?.resumen ?? ""}
      avisos={contenido?.avisos}
      isLoading={isLoading || !contenido}
    />
  )
}
