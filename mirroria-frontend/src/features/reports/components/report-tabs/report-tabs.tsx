import { X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { reportsApi } from "../../api/reportsApi"
import type { ReportTab } from "../../types/chat.types"
import type { Reporte } from "../../types/reports.types"
import { ReporteResultado } from "../reporte-resultado"
import { ResumenReportes } from "../resumen-reportes"

interface ReportTabsProps {
  tabs: ReportTab[]
  activaId: string
  onActivar: (id: string) => void
  onCerrar: (id: string) => void
  onActualizarReporte?: (tabId: string, nuevoReporte: Reporte) => void
}

export function ReportTabs({ tabs, activaId, onActivar, onCerrar, onActualizarReporte }: ReportTabsProps) {
  async function handlePivote(tabId: string, reporteActual: Reporte, nuevaDimension: string) {
    try {
      const ficha = { ...reporteActual.ficha, agruparPor: nuevaDimension }
      const res = await reportsApi.consultar(ficha)
      onActualizarReporte?.(tabId, res)
    } catch {
      // Si la combinación no es válida, no muta la tab
    }
  }

  return (
    <Tabs value={activaId} onValueChange={(v) => onActivar(v as string)} className="h-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="shrink-0">
            {tab.titulo}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="resumen">
        <ResumenReportes />
      </TabsContent>

      {tabs
        .filter((tab) => tab.tipo === "reporte")
        .map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{tab.titulo}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                onClick={() => onCerrar(tab.id)}
              >
                <X className="size-3.5" />
                Cerrar
              </Button>
            </div>
            {tab.cargando || !tab.reporte ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <ReporteResultado
                reporte={tab.reporte}
                onPivoteChange={(nuevaDim) => handlePivote(tab.id, tab.reporte!, nuevaDim)}
              />
            )}
          </TabsContent>
        ))}
    </Tabs>
  )
}
