import { GraduationCap } from "@phosphor-icons/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MetricasModelosResponse } from "../../types/ml.types"
import { MlValidacionCientifica } from "./ml-validacion-cientifica"

interface MlFichaTecnicaDialogProps {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  data?: MetricasModelosResponse | null
  isLoading?: boolean
}

/** Diálogo modal con la ficha metodológica y citas académicas para evaluación SI2. */
export function MlFichaTecnicaDialog({
  abierto,
  onOpenChange,
  data,
  isLoading,
}: MlFichaTecnicaDialogProps) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[88vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <GraduationCap className="size-5" weight="duotone" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Ficha Técnica Metodológica & Citas Académicas (SI2)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Auditoría empírica, citas bibliográficas formales y parámetros reproducibles de los 4 modelos de ML.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-2">
          <MlValidacionCientifica data={data} isLoading={isLoading} embedded />
        </div>
      </DialogContent>
    </Dialog>
  )
}
