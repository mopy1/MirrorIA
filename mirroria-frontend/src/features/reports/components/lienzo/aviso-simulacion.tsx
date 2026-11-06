import { ChartLineUp } from "@phosphor-icons/react"
import { AyudaTermino } from "@/components/common/ayuda-termino"

/** Avisa que las cifras son una proyección (nunca se nombra el motor que la calcula). */
export function AvisoSimulacion({ escenario }: { escenario: string | null }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-foreground">
      <ChartLineUp className="size-4 text-primary" aria-hidden />
      <span className="font-medium">Escenario simulado</span>
      {escenario && <span className="text-muted-foreground">· {escenario}</span>}
      <AyudaTermino titulo="Escenario simulado">
        Es una proyección: muestra qué pasaría si cambiaran el precio o la cantidad vendida, partiendo de tus ventas reales.
        No son ventas que ya ocurrieron.
      </AyudaTermino>
    </p>
  )
}
