import { useMemo } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CalendarBlank } from "@phosphor-icons/react"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import type { NoShowAgendaResponse } from "../../types/ml.types"
import { contar, normalizarProbabilidad, vendraCita } from "../../lib/ml-lenguaje"
import { SeccionPrediccion } from "../comun/seccion-prediccion"
import { EsqueletoFilas, EstadoError, EstadoVacio } from "../comun/estados-bloque"
import { FilaCita } from "./fila-cita"

interface SeccionCitasProps {
  data: NoShowAgendaResponse | null
  isLoading: boolean
  error: string | null
  onReintentar: () => void
  limite?: number
  onVerTodo?: () => void
}

/** "Citas en riesgo": las citas de hoy, primero las que pueden fallar, con qué hacer. */
export function SeccionCitas({ data, isLoading, error, onReintentar, limite, onVerTodo }: SeccionCitasProps) {
  const { user } = useAuth()
  const tienda = user?.tenant?.nombre || "la tienda"
  const citas = useMemo(
    () =>
      [...(data?.evaluaciones ?? [])].sort(
        (a, b) => normalizarProbabilidad(b.probabilidad_no_show) - normalizarProbabilidad(a.probabilidad_no_show),
      ),
    [data],
  )
  const enRiesgo = citas.filter((c) => vendraCita(c.probabilidad_no_show).enRiesgo).length

  const frase = data
    ? citas.length === 0
      ? undefined
      : enRiesgo > 0
        ? `De ${contar(citas.length, "cita", "citas")} de hoy, ${enRiesgo === 1 ? "1 puede fallar" : `${enRiesgo} pueden fallar`}. Un mensaje a tiempo suele salvarla${enRiesgo === 1 ? "" : "s"}.`
        : citas.length === 1
          ? "La cita de hoy parece segura: no hace falta reconfirmar."
          : `Las ${citas.length} citas de hoy parecen seguras: no hace falta reconfirmar.`
    : undefined

  const accion = onVerTodo ? (
    <Button variant="ghost" size="sm" onClick={onVerTodo}>Ver todas <ArrowRight data-icon="inline-end" aria-hidden /></Button>
  ) : (
    <Link to="/admin/reservas" className={buttonVariants({ variant: "outline", size: "sm" })}>Ir a Reservas</Link>
  )

  const visibles = limite ? citas.slice(0, limite) : citas

  return (
    <SeccionPrediccion titulo="Citas en riesgo" frase={frase} accion={accion}>
      {isLoading && !data ? (
        <EsqueletoFilas filas={limite ?? 3} />
      ) : error && !data ? (
        <EstadoError que="las citas de hoy" onReintentar={onReintentar} />
      ) : citas.length === 0 ? (
        <EstadoVacio icono={CalendarBlank} titulo="No hay citas de probador para hoy">
          Cuando una clienta reserve una prenda para probársela, acá vas a ver si es probable que venga y qué hacer si no.
        </EstadoVacio>
      ) : (
        <ul className="divide-y divide-border/70">
          {visibles.map((c) => (
            <FilaCita key={c.reserva_id} item={c} tienda={tienda} />
          ))}
        </ul>
      )}
    </SeccionPrediccion>
  )
}
