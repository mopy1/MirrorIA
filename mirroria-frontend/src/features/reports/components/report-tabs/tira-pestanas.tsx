import { useEffect, type KeyboardEvent } from "react"
import type { ReportTab } from "../../types/chat.types"
import { Pestana } from "./pestana"
import { idPestana, indiceSegunTecla } from "./pestanas-teclado"

interface TiraPestanasProps {
  tabs: ReportTab[]
  activaId: string
  onActivar: (id: string) => void
  onCerrar: (id: string) => void
}

/** Tira de pestañas tipo documento con scroll horizontal. Teclado: ← → Inicio Fin
 * mueven y activan; Supr cierra el reporte enfocado. "Resumen" siempre primera. */
export function TiraPestanas({ tabs, activaId, onActivar, onCerrar }: TiraPestanasProps) {
  useEffect(() => {
    document.getElementById(idPestana(activaId))?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [activaId])

  function enTecla(e: KeyboardEvent<HTMLDivElement>) {
    if (!(e.target instanceof HTMLElement) || e.target.getAttribute("role") !== "tab") return
    const actual = tabs.findIndex((t) => t.id === activaId)
    if (e.key === "Delete" && activaId !== "resumen") {
      e.preventDefault()
      onCerrar(activaId)
      document.getElementById(idPestana("resumen"))?.focus()
      return
    }
    const siguiente = indiceSegunTecla(actual, tabs.length, e.key)
    if (siguiente === null) return
    e.preventDefault()
    const id = tabs[siguiente].id
    onActivar(id)
    document.getElementById(idPestana(id))?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Reportes abiertos"
      onKeyDown={enTecla}
      className="flex items-end gap-0.5 overflow-x-auto overflow-y-hidden pt-1 shadow-[inset_0_-1px_0_var(--border)] [scrollbar-width:thin]"
    >
      {tabs.map((tab) => (
        <Pestana
          key={tab.id}
          tab={tab}
          activa={tab.id === activaId}
          onActivar={() => onActivar(tab.id)}
          onCerrar={() => onCerrar(tab.id)}
        />
      ))}
    </div>
  )
}
