import { HourglassMedium } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import type { InquilinoResumenDto } from "../types/plataforma.types"

/** Aviso con las pruebas que vencen en ≤ 7 días (del resumen). Sin pruebas por vencer no se muestra. */
export function TrialsPorVencer({ trials }: { trials: InquilinoResumenDto[] }) {
  if (trials.length === 0) return null
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
        <HourglassMedium className="size-4" /> {trials.length} {trials.length === 1 ? "prueba vence" : "pruebas vencen"} esta semana
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {trials.map((t) => (
          <li key={t.id}>
            <Link to={`/plataforma/inquilinos/${t.id}`} className="inline-flex rounded-lg border border-amber-500/20 bg-card px-2.5 py-1 text-xs transition-colors hover:border-amber-500/50">
              {t.nombre} · {t.suscripcion.diasRestantes} días
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
