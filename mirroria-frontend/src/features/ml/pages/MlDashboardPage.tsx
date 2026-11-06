import { useState } from "react"
import {
  useAnomaliasVentas,
  useDemandaMl,
  useModelosMetricas,
  useNoShowAgenda,
  useRfmSegmentos,
} from "../hooks/useMlKpis"
import { MlHeader } from "../components/ml-header"
import { MlToolbar, type MlVistaTab } from "../components/ml-toolbar"
import { MlKpiRibbon } from "../components/ml-kpi-ribbon"
import { MlDemandaSection } from "../components/demanda/ml-demanda-section"
import { MlNoshowPanel } from "../components/noshow/ml-noshow-panel"
import { MlRfmSection } from "../components/rfm/ml-rfm-section"
import { MlAnomaliasSection } from "../components/anomalias/ml-anomalias-section"
import { MlFichaTecnicaDialog } from "../components/cientifico/ml-ficha-tecnica-dialog"

/** Panel ejecutivo de Machine Learning: vista unificada y navegación sin pestañas apiladas. */
export function MlDashboardPage() {
  const [vista, setVista] = useState<MlVistaTab>(() => {
    const param = new URLSearchParams(window.location.search).get("tab")
    if (param === "demanda" || param === "noshow" || param === "rfm" || param === "auditoria") {
      return param
    }
    return "overview"
  })
  const [dias, setDias] = useState<number>(30)
  const [sucursalId, setSucursalId] = useState<string | undefined>(undefined)
  const [fichaAbierta, setFichaAbierta] = useState<boolean>(false)

  const demanda = useDemandaMl({ dias, sucursalId })
  const noShow = useNoShowAgenda({ sucursalId })
  const rfm = useRfmSegmentos()
  const anomalias = useAnomaliasVentas({ sucursalId })
  const metricas = useModelosMetricas()

  const cargando = demanda.isLoading || noShow.isLoading || rfm.isLoading || anomalias.isLoading || metricas.isLoading
  const esFallback = Boolean(demanda.data?.fallback || noShow.data?.fallback || rfm.data?.fallback)

  const recargarTodo = () => {
    void Promise.all([demanda.reload(), noShow.reload(), rfm.reload(), anomalias.reload(), metricas.reload()])
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <MlHeader
        esFallback={esFallback}
        cargando={cargando}
        onActualizar={recargarTodo}
        onAbrirFichaTecnica={() => setFichaAbierta(true)}
      />

      <MlToolbar
        vista={vista}
        onVistaChange={setVista}
        dias={dias}
        onDiasChange={setDias}
        sucursalId={sucursalId}
        onSucursalChange={setSucursalId}
        disabled={cargando}
      />

      <MlKpiRibbon demanda={demanda.data} noShow={noShow.data} rfm={rfm.data} anomalias={anomalias.data} />

      {vista === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-8">
              <MlDemandaSection data={demanda.data} isLoading={demanda.isLoading} />
            </div>
            <div className="lg:col-span-4">
              <MlNoshowPanel data={noShow.data} isLoading={noShow.isLoading} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MlRfmSection data={rfm.data} isLoading={rfm.isLoading} />
            <MlAnomaliasSection data={anomalias.data} isLoading={anomalias.isLoading} />
          </div>
        </div>
      )}

      {vista === "demanda" && <MlDemandaSection data={demanda.data} isLoading={demanda.isLoading} />}
      {vista === "noshow" && <MlNoshowPanel data={noShow.data} isLoading={noShow.isLoading} />}
      {vista === "rfm" && <MlRfmSection data={rfm.data} isLoading={rfm.isLoading} />}
      {vista === "auditoria" && <MlAnomaliasSection data={anomalias.data} isLoading={anomalias.isLoading} />}

      <MlFichaTecnicaDialog
        abierto={fichaAbierta}
        onOpenChange={setFichaAbierta}
        data={metricas.data}
        isLoading={metricas.isLoading}
      />
    </div>
  )
}
