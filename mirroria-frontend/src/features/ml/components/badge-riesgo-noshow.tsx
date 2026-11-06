import { normalizarProbabilidad, vendraCita } from "../lib/ml-lenguaje"
import { EstadoPill } from "./comun/estado-pill"

interface BadgeRiesgoNoShowProps {
  probabilidad: number
  /** Se conserva por compatibilidad: la etiqueta sale de la probabilidad. */
  clasificacion?: string
  className?: string
  /** Agrega la probabilidad en % al lado de la palabra (por defecto, solo palabras). */
  mostrarPorcentaje?: boolean
}

/**
 * "¿Vendrá?" en palabras: Seguro · Puede faltar · Probable que falte.
 * Lo usa también el dashboard (agenda de citas de hoy); mantener esta firma.
 */
export function BadgeRiesgoNoShow({ probabilidad, className, mostrarPorcentaje = false }: BadgeRiesgoNoShowProps) {
  const { etiqueta, tono } = vendraCita(probabilidad)
  const pct = Math.round(normalizarProbabilidad(probabilidad) * 100)
  return (
    <EstadoPill tono={tono} className={className}>
      {etiqueta}
      {mostrarPorcentaje && <span className="tabular-nums opacity-80"> · {pct}%</span>}
    </EstadoPill>
  )
}
