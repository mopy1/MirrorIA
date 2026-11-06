import { useMarcarLlegada } from "../../hooks/useMarcarLlegada"
import type { ReservaHoyItemDto } from "../../types/dashboard.types"
import { Skeleton } from "@/components/ui/skeleton"
import { Seccion, VacioUtil } from "../shared/seccion"
import { CitaFila } from "./cita-fila"

interface AgendaCitasProps {
  citas?: ReservaHoyItemDto[]
  isLoading?: boolean
  onActualizado?: () => void
}

const AYUDA =
  "Las clientas que reservaron prendas para venir a probárselas hoy. \"¿Vendrá?\" es nuestra estimación según su historial: si dice que puede faltar, conviene escribirle antes."

/** Agenda del día como línea de tiempo. */
export function AgendaCitas({ citas, isLoading, onActualizado }: AgendaCitasProps) {
  const { marcarLlegada, actualizandoId, error } = useMarcarLlegada(onActualizado)
  const titulo = "Citas de hoy"
  const enlace = { href: "/admin/reservas", texto: "Ver todas las reservas" }

  if (isLoading || !citas) {
    return (
      <Seccion titulo={titulo} ayuda={AYUDA}>
        <div className="flex flex-col gap-5" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3">
              <Skeleton className="h-4 w-11" />
              <div className="space-y-2 pl-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          ))}
        </div>
      </Seccion>
    )
  }
  if (citas.length === 0) {
    return (
      <Seccion titulo={titulo} ayuda={AYUDA}>
        <VacioUtil
          texto="No hay citas para hoy. Cuando una clienta reserve prendas para probárselas, va a aparecer aquí con su hora."
          enlace={enlace}
        />
      </Seccion>
    )
  }

  const ahora = new Date()
  return (
    <Seccion titulo={titulo} ayuda={AYUDA} descripcion={`${citas.length} ${citas.length === 1 ? "cita" : "citas"} en el día`} enlace={enlace}>
      <ol className="max-h-[32rem] overflow-y-auto pr-1">
        {citas.map((c) => (
          <CitaFila
            key={c.reservaId}
            cita={c}
            ahora={ahora}
            marcando={actualizandoId === c.reservaId}
            error={error?.id === c.reservaId ? error.mensaje : undefined}
            onMarcarLlegada={marcarLlegada}
          />
        ))}
      </ol>
    </Seccion>
  )
}
