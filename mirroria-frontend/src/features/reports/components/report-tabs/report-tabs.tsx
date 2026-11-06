import type { ReportTab, TabReporte } from "../../types/chat.types"
import type { Reporte } from "../../types/reports.types"
import { ResumenReportes } from "../resumen-reportes"
import { PanelReporte } from "./panel-reporte"
import { ID_PANEL, idPestana } from "./pestanas-teclado"
import { TiraPestanas } from "./tira-pestanas"

interface ReportTabsProps {
  tabs: ReportTab[]
  activaId: string
  onActivar: (id: string) => void
  onCerrar: (id: string) => void
  onReintentar: (id: string) => void
  onPreguntar: (texto: string) => void
  preguntando: boolean
  onActualizarReporte?: (tabId: string, nuevoReporte: Reporte) => void
}

/** Pestañas de la página: "Resumen" (inicio) fija + un documento por reporte. */
export function ReportTabs({ tabs, activaId, onActivar, onCerrar, onReintentar, onPreguntar, preguntando, onActualizarReporte }: ReportTabsProps) {
  const activa = tabs.find((t) => t.id === activaId) ?? tabs[0]
  const reportes = tabs.filter((t): t is TabReporte => t.tipo === "reporte")

  return (
    <div className="min-w-0">
      <TiraPestanas tabs={tabs} activaId={activa.id} onActivar={onActivar} onCerrar={onCerrar} />
      <div
        role="tabpanel"
        id={ID_PANEL}
        aria-labelledby={idPestana(activa.id)}
        className="min-w-0 pt-5 outline-none sm:pt-6"
      >
        {activa.tipo === "resumen" ? (
          <ResumenReportes reportes={reportes} onAbrirTab={onActivar} onPreguntar={onPreguntar} preguntando={preguntando} />
        ) : (
          <PanelReporte
            key={activa.id}
            tab={activa}
            onCerrar={onCerrar}
            onReintentar={onReintentar}
            onPreguntar={onPreguntar}
            onActualizarReporte={onActualizarReporte}
          />
        )}
      </div>
    </div>
  )
}
