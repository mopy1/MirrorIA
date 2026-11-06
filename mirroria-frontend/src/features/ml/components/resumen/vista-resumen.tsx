import { useMemo } from "react"
import type { usePrediccionesMl } from "../../hooks/usePrediccionesMl"
import { armarAccionesSemana } from "../../lib/ml-acciones"
import { armarKpis } from "../../lib/ml-kpis"
import type { TabPrediccion } from "../../lib/ml-tabs"
import { SeccionCitas } from "../citas/seccion-citas"
import { SeccionReponer } from "../reponer/seccion-reponer"
import { AccionesSemana } from "./acciones-semana"
import { KpisPrediccion } from "./kpis-prediccion"

interface VistaResumenProps {
  p: ReturnType<typeof usePrediccionesMl>
  onIrA: (tab: TabPrediccion) => void
}

/** Pestaña Resumen: qué hacer esta semana, los 4 números y lo más urgente de reponer y de citas. */
export function VistaResumen({ p, onIrA }: VistaResumenProps) {
  const { demanda, noShow, rfm, anomalias, nombres } = p
  const datos = useMemo(
    () => ({ demanda: demanda.data, noShow: noShow.data, rfm: rfm.data, anomalias: anomalias.data, nombres }),
    [demanda.data, noShow.data, rfm.data, anomalias.data, nombres],
  )
  const acciones = useMemo(() => armarAccionesSemana(datos), [datos])
  const kpis = useMemo(() => armarKpis(datos), [datos])
  const cargandoInicial = p.cargando && !demanda.data && !noShow.data

  return (
    <div className="space-y-6">
      <AccionesSemana acciones={acciones} isLoading={cargandoInicial} onIrA={onIrA} />
      <KpisPrediccion kpis={kpis} isLoading={cargandoInicial} onIrA={onIrA} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <SeccionReponer
          data={demanda.data}
          nombres={nombres}
          isLoading={demanda.isLoading}
          error={demanda.error}
          onReintentar={() => void demanda.reload()}
          limite={4}
          onVerTodo={() => onIrA("demanda")}
        />
        <SeccionCitas
          data={noShow.data}
          isLoading={noShow.isLoading}
          error={noShow.error}
          onReintentar={() => void noShow.reload()}
          limite={3}
          onVerTodo={() => onIrA("noshow")}
        />
      </div>
    </div>
  )
}
