import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { MetricasModelosResponse } from "../../types/ml.types"
import type { DatosPredicciones } from "../../lib/ml-acciones"
import { IndicadoresTecnicos } from "./indicadores-tecnicos"
import { MlValidacionCientifica } from "./ml-validacion-cientifica"

interface FichaTecnicaSheetProps {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  metricas: MetricasModelosResponse | null
  cargandoMetricas: boolean
  datos: DatosPredicciones
  esEstimacion: boolean
}

/** "¿Cómo se calcula?": el único lugar con jerga técnica (modelos, métricas, citas). Para la defensa SI2. */
export function FichaTecnicaSheet({ abierto, onOpenChange, metricas, cargandoMetricas, datos, esEstimacion }: FichaTecnicaSheetProps) {
  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b border-border pr-12">
          <SheetTitle>¿Cómo se calcula?</SheetTitle>
          <SheetDescription>
            Cada predicción sale de un modelo de aprendizaje automático entrenado con datos de la tienda.
            Acá está la ficha técnica: algoritmos, métricas de evaluación y referencias.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Indicadores de los modelos</h3>
            <IndicadoresTecnicos {...datos} esEstimacion={esEstimacion} />
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Ficha técnica y citas académicas (SI2)</h3>
            <MlValidacionCientifica data={metricas} isLoading={cargandoMetricas} />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
