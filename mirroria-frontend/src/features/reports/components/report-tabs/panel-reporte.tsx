import { reportsApi } from "../../api/reportsApi"
import type { TabReporte } from "../../types/chat.types"
import type { Reporte } from "../../types/reports.types"
import { ReporteCargando } from "../lienzo/reporte-cargando"
import { ReporteError } from "../lienzo/reporte-error"
import { ReporteResultado } from "../reporte-resultado"

interface PanelReporteProps {
  tab: TabReporte
  onCerrar: (id: string) => void
  onReintentar: (id: string) => void
  onPreguntar: (texto: string) => void
  onActualizarReporte?: (tabId: string, nuevoReporte: Reporte) => void
}

/** Contenido de una pestaña de reporte: generando → error con Reintentar → lienzo. */
export function PanelReporte({ tab, onCerrar, onReintentar, onPreguntar, onActualizarReporte }: PanelReporteProps) {
  if (tab.cargando) return <ReporteCargando desde={tab.iniciadoEn} />

  if (tab.error || !tab.reporte) {
    const puedeReintentar = Boolean(tab.reintentable && tab.pregunta)
    return (
      <ReporteError
        mensaje={tab.error ?? "Este reporte no tiene datos para mostrar."}
        onReintentar={puedeReintentar ? () => onReintentar(tab.id) : undefined}
      />
    )
  }

  const reporte = tab.reporte
  async function pivotear(nuevaDimension: string) {
    try {
      const res = await reportsApi.consultar({ ...reporte.ficha, agruparPor: nuevaDimension })
      onActualizarReporte?.(tab.id, res)
    } catch {
      // Si la combinación no es válida, el reporte queda como estaba.
    }
  }

  return (
    <ReporteResultado
      reporte={reporte}
      titulo={tab.pregunta ?? tab.titulo}
      generadoEn={tab.generadoEn}
      onPivoteChange={(dim) => void pivotear(dim)}
      onPreguntar={onPreguntar}
      onCerrar={() => onCerrar(tab.id)}
    />
  )
}
