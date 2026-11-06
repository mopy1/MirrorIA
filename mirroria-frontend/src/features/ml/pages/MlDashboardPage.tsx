import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useAnomaliasVentas,
  useDemandaMl,
  useModelosMetricas,
  useNoShowAgenda,
  useRfmSegmentos,
} from "../hooks/useMlKpis"
import { MlHeader } from "../components/ml-header"
import { MlFiltros } from "../components/ml-filtros"
import { MlKpiRibbon } from "../components/ml-kpi-ribbon"
import { MlDemandaSection } from "../components/demanda/ml-demanda-section"
import { MlNoshowPanel } from "../components/noshow/ml-noshow-panel"
import { MlRfmSection } from "../components/rfm/ml-rfm-section"
import { MlAnomaliasSection } from "../components/anomalias/ml-anomalias-section"
import { MlValidacionCientifica } from "../components/cientifico/ml-validacion-cientifica"
import { MlFichaTecnicaDialog } from "../components/cientifico/ml-ficha-tecnica-dialog"

/** Panel de Machine Learning Operativo (Operate Mode). */
export function MlDashboardPage() {
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get("tab") || "overview")
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

      <MlFiltros
        dias={dias}
        onDiasChange={setDias}
        sucursalId={sucursalId}
        onSucursalChange={setSucursalId}
        disabled={cargando}
      />

      <MlKpiRibbon demanda={demanda.data} noShow={noShow.data} rfm={rfm.data} anomalias={anomalias.data} />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-3 sm:grid-cols-6 text-xs">
          <TabsTrigger value="overview">Operate</TabsTrigger>
          <TabsTrigger value="demanda">Demanda</TabsTrigger>
          <TabsTrigger value="noshow">No-Show</TabsTrigger>
          <TabsTrigger value="rfm">Clientas</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
          <TabsTrigger value="metodologia">Ficha Técnica</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="demanda" className="space-y-6">
          <MlDemandaSection data={demanda.data} isLoading={demanda.isLoading} />
        </TabsContent>
        <TabsContent value="noshow" className="space-y-6">
          <MlNoshowPanel data={noShow.data} isLoading={noShow.isLoading} />
        </TabsContent>
        <TabsContent value="rfm" className="space-y-6">
          <MlRfmSection data={rfm.data} isLoading={rfm.isLoading} />
        </TabsContent>
        <TabsContent value="auditoria" className="space-y-6">
          <MlAnomaliasSection data={anomalias.data} isLoading={anomalias.isLoading} />
        </TabsContent>
        <TabsContent value="metodologia" className="space-y-6">
          <MlValidacionCientifica data={metricas.data} isLoading={metricas.isLoading} />
        </TabsContent>
      </Tabs>

      <MlFichaTecnicaDialog
        abierto={fichaAbierta}
        onOpenChange={setFichaAbierta}
        data={metricas.data}
        isLoading={metricas.isLoading}
      />
    </div>
  )
}
