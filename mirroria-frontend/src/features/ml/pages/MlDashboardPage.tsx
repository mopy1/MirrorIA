import { useState } from "react"
import { Brain, ArrowClockwise } from "@phosphor-icons/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  useAnomaliasVentas,
  useDemandaMl,
  useModelosMetricas,
  useNoShowAgenda,
  useRfmSegmentos,
} from "../hooks/useMlKpis"
import { WidgetDemandaPredicha } from "../components/widget-demanda-predicha"
import { WidgetNoshowAgenda } from "../components/widget-noshow-agenda"
import { WidgetRfmSegmentos } from "../components/widget-rfm-segmentos"
import { WidgetAnomaliasVentas } from "../components/widget-anomalias-ventas"
import { WidgetCalidadModelos } from "../components/widget-calidad-modelos"

export function MlDashboardPage() {
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get("tab") || "overview")
  const demanda = useDemandaMl({ dias: 30 })
  const noShow = useNoShowAgenda()
  const rfm = useRfmSegmentos()
  const anomalias = useAnomaliasVentas()
  const metricas = useModelosMetricas()

  const cargando = demanda.isLoading || noShow.isLoading || rfm.isLoading || anomalias.isLoading
  const esFallback = demanda.data?.fallback || noShow.data?.fallback || rfm.data?.fallback

  const recargarTodo = () => {
    void Promise.all([demanda.reload(), noShow.reload(), rfm.reload(), anomalias.reload(), metricas.reload()])
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Brain className="size-6" weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground font-heading">
                  Predicciones & Machine Learning
                </h1>
                {esFallback && (
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 text-[10px]">
                    Modo Heurístico
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Proyecciones inteligentes de demanda, asistencia a probador, valor de clientas y control de caja.
              </p>
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={recargarTodo} disabled={cargando} className="gap-1.5 text-xs self-start sm:self-auto">
          <ArrowClockwise className={`size-3.5 ${cargando ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="demanda">Demanda</TabsTrigger>
          <TabsTrigger value="noshow">Citas & No-Show</TabsTrigger>
          <TabsTrigger value="rfm">Clientas RFM</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría POS</TabsTrigger>
          <TabsTrigger value="cientifico">Validación</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WidgetDemandaPredicha data={demanda.data} isLoading={demanda.isLoading} />
            <WidgetNoshowAgenda data={noShow.data} isLoading={noShow.isLoading} />
            <WidgetRfmSegmentos data={rfm.data} isLoading={rfm.isLoading} />
            <WidgetAnomaliasVentas data={anomalias.data} isLoading={anomalias.isLoading} />
          </div>
          <WidgetCalidadModelos data={metricas.data} isLoading={metricas.isLoading} />
        </TabsContent>

        <TabsContent value="demanda" className="space-y-6">
          <WidgetDemandaPredicha data={demanda.data} isLoading={demanda.isLoading} />
          <WidgetCalidadModelos data={metricas.data} isLoading={metricas.isLoading} />
        </TabsContent>

        <TabsContent value="noshow" className="space-y-6">
          <WidgetNoshowAgenda data={noShow.data} isLoading={noShow.isLoading} />
        </TabsContent>

        <TabsContent value="rfm" className="space-y-6">
          <WidgetRfmSegmentos data={rfm.data} isLoading={rfm.isLoading} />
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-6">
          <WidgetAnomaliasVentas data={anomalias.data} isLoading={anomalias.isLoading} />
        </TabsContent>

        <TabsContent value="cientifico" className="space-y-6">
          <WidgetCalidadModelos data={metricas.data} isLoading={metricas.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
