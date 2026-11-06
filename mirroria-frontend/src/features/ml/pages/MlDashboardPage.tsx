import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { usePrediccionesMl } from "../hooks/usePrediccionesMl"
import { useTabPredicciones } from "../hooks/useTabPredicciones"
import { leerTab } from "../lib/ml-tabs"
import { PrediccionesEncabezado } from "../components/predicciones-encabezado"
import { PrediccionesBarra } from "../components/predicciones-barra"
import { VistaResumen } from "../components/resumen/vista-resumen"
import { SeccionReponer } from "../components/reponer/seccion-reponer"
import { SeccionCitas } from "../components/citas/seccion-citas"
import { SeccionClientas } from "../components/clientas/seccion-clientas"
import { SeccionVentas } from "../components/ventas/seccion-ventas"
import { FichaTecnicaSheet } from "../components/cientifico/ficha-tecnica-sheet"

/** /admin/ml — Predicciones en lenguaje de negocio; lo técnico vive en "¿Cómo se calcula?". */
export function MlDashboardPage() {
  const [tab, setTab] = useTabPredicciones()
  const [dias, setDias] = useState(30)
  const [sucursalId, setSucursalId] = useState<string | undefined>(undefined)
  const [fichaAbierta, setFichaAbierta] = useState(false)
  const p = usePrediccionesMl({ dias, sucursalId })
  const { demanda, noShow, rfm, anomalias, metricas, nombres } = p

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-5 p-4 sm:p-6">
      <PrediccionesEncabezado
        cargando={p.cargando}
        esEstimacion={p.esEstimacion}
        onActualizar={p.recargarTodo}
        onComoSeCalcula={() => setFichaAbierta(true)}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(leerTab(String(v)))} className="min-w-0 gap-5">
        <PrediccionesBarra dias={dias} onDiasChange={setDias} sucursalId={sucursalId} onSucursalChange={setSucursalId} />
        <TabsContent value="resumen">
          <VistaResumen p={p} onIrA={setTab} />
        </TabsContent>
        <TabsContent value="demanda">
          <SeccionReponer data={demanda.data} nombres={nombres} isLoading={demanda.isLoading} error={demanda.error} onReintentar={() => void demanda.reload()} />
        </TabsContent>
        <TabsContent value="noshow">
          <SeccionCitas data={noShow.data} isLoading={noShow.isLoading} error={noShow.error} onReintentar={() => void noShow.reload()} />
        </TabsContent>
        <TabsContent value="rfm">
          <SeccionClientas data={rfm.data} isLoading={rfm.isLoading} error={rfm.error} onReintentar={() => void rfm.reload()} />
        </TabsContent>
        <TabsContent value="auditoria">
          <SeccionVentas data={anomalias.data} isLoading={anomalias.isLoading} error={anomalias.error} onReintentar={() => void anomalias.reload()} />
        </TabsContent>
      </Tabs>

      <FichaTecnicaSheet
        abierto={fichaAbierta}
        onOpenChange={setFichaAbierta}
        metricas={metricas.data}
        cargandoMetricas={metricas.isLoading}
        datos={{ demanda: demanda.data, noShow: noShow.data, rfm: rfm.data, anomalias: anomalias.data }}
        esEstimacion={p.esEstimacion}
      />
    </div>
  )
}
