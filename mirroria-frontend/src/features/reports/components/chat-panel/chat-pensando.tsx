import { useEffect, useState } from "react"
import { Sparkle } from "@phosphor-icons/react"
import { ETAPAS_REPORTE, etapaPorTiempo } from "../../lib/etapas-reporte"

/** "Pensando" con la etapa actual (las mismas que muestra el lienzo mientras carga). */
export function ChatPensando({ desde }: { desde: number }) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  const etapa = etapaPorTiempo(ahora - desde)

  return (
    <div className="flex gap-2.5" role="status" aria-live="polite">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkle className="size-4 animate-pulse motion-reduce:animate-none" weight="fill" />
      </span>
      <div className="min-w-0 pt-1">
        <p className="text-[13px] font-medium text-foreground">{ETAPAS_REPORTE[etapa]}…</p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          Paso {etapa + 1} de {ETAPAS_REPORTE.length}
        </p>
      </div>
    </div>
  )
}
