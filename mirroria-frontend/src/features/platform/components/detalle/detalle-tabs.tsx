import { UsoPlanMeters } from "@/components/common/UsoPlanMeters"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { InquilinoDetalleDto } from "../../types/plataforma.types"
import { ActividadFeed } from "../actividad-feed"
import { TabMetricas } from "./tab-metricas"
import { TabResumen } from "./tab-resumen"
import { TabSuscripcion } from "./tab-suscripcion"

const PESTANAS = ["Resumen", "Suscripción", "Uso", "Métricas", "Actividad"] as const

/** Pestañas del detalle (CU39). Métricas se pide recién al abrir la pestaña. */
export function DetalleTabs({ i }: { i: InquilinoDetalleDto }) {
  return (
    <Tabs defaultValue="Resumen" className="gap-6">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <TabsList variant="line" className="h-10">
          {PESTANAS.map((p) => <TabsTrigger key={p} value={p} className="px-3">{p}</TabsTrigger>)}
        </TabsList>
      </div>
      <TabsContent value="Resumen"><TabResumen i={i} /></TabsContent>
      <TabsContent value="Suscripción"><TabSuscripcion i={i} /></TabsContent>
      <TabsContent value="Uso" className="space-y-3">
        <h2 className="text-base font-medium">Uso frente a los límites del plan</h2>
        <UsoPlanMeters uso={i.uso} limites={i.limites} />
      </TabsContent>
      <TabsContent value="Métricas"><TabMetricas id={i.id} /></TabsContent>
      <TabsContent value="Actividad"><ActividadFeed eventos={i.actividad ?? []} conTienda={false} /></TabsContent>
    </Tabs>
  )
}
