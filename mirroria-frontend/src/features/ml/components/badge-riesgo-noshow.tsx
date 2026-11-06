import { CheckCircle, Warning, WarningOctagon } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"

interface BadgeRiesgoNoShowProps {
  probabilidad: number
  clasificacion?: string
  className?: string
  mostrarPorcentaje?: boolean
}

export function BadgeRiesgoNoShow({
  probabilidad,
  clasificacion,
  className = "",
  mostrarPorcentaje = true,
}: BadgeRiesgoNoShowProps) {
  // Normalizar probabilidad al rango [0, 1]
  const p = probabilidad > 1 ? probabilidad / 100 : probabilidad
  const pct = Math.round(p * 100)

  if (p < 0.3) {
    return (
      <Badge
        variant="outline"
        className={`inline-flex items-center gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-medium ${className}`}
      >
        <CheckCircle className="size-3" weight="bold" />
        <span>Bajo {mostrarPorcentaje ? `(${pct}%)` : "< 30%"}</span>
      </Badge>
    )
  }

  if (p <= 0.6) {
    return (
      <Badge
        variant="outline"
        className={`inline-flex items-center gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 font-medium ${className}`}
      >
        <Warning className="size-3" weight="bold" />
        <span>Moderado {mostrarPorcentaje ? `(${pct}%)` : "30-60%"}</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 border-rose-500/30 bg-rose-500/10 text-rose-600 font-semibold ${className}`}
    >
      <WarningOctagon className="size-3" weight="fill" />
      <span>{clasificacion === "ALTO_RIESGO" ? "Alto Riesgo" : "Alto"} {mostrarPorcentaje ? `(${pct}%)` : "> 60%"}</span>
    </Badge>
  )
}
