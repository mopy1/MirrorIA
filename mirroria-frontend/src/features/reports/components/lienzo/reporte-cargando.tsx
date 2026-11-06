import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ETAPAS_REPORTE, etapaPorTiempo } from "../../lib/etapas-reporte"
import { EtapasProgreso } from "./etapas-progreso"

/**
 * Mientras la IA arma el reporte: etapas con sentido + skeleton con la forma del lienzo
 * (encabezado, conclusión, cifras, gráfico, análisis). `desde` = `Date.now()` del inicio.
 */
export function ReporteCargando({ desde }: { desde: number }) {
  const [etapa, setEtapa] = useState(() => etapaPorTiempo(Date.now() - desde))

  useEffect(() => {
    const id = window.setInterval(() => setEtapa(etapaPorTiempo(Date.now() - desde)), 400)
    return () => window.clearInterval(id)
  }, [desde])

  return (
    <article aria-busy="true" className="@container min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <div className="px-4 pt-6 pb-5 sm:px-7">
        <p className="sr-only" aria-live="polite">
          {ETAPAS_REPORTE[etapa]}
        </p>
        <EtapasProgreso actual={etapa} />
        <Skeleton className="mt-6 h-7 w-3/4 max-w-md" />
        <Skeleton className="mt-2.5 h-4 w-56" />
      </div>
      <div className="space-y-2.5 bg-primary/[0.05] px-4 py-5 sm:px-7">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-5 w-2/3 max-w-xl" />
      </div>
      <div className="divide-y divide-border border-t border-border">
        <div className="grid grid-cols-1 gap-5 px-4 py-6 sm:px-7 @md:grid-cols-2 @3xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
        <div className="space-y-4 px-4 py-6 sm:px-7">
          {[92, 74, 58, 41, 30].map((ancho) => (
            <div key={ancho} className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-2 rounded-full" style={{ width: `${ancho}%` }} />
            </div>
          ))}
        </div>
        <div className="space-y-2 px-4 py-6 sm:px-7">
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-11/12 max-w-2xl" />
          <Skeleton className="h-4 w-3/5 max-w-xl" />
        </div>
      </div>
    </article>
  )
}
