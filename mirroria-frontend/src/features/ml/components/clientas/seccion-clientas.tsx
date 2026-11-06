import { useMemo } from "react"
import { UsersThree } from "@phosphor-icons/react"
import { useAuth } from "@/hooks/useAuth"
import type { RfmSegmentosResponse } from "../../types/ml.types"
import { armarGruposClientas } from "../../lib/ml-clientas"
import { contar } from "../../lib/ml-lenguaje"
import { SeccionPrediccion } from "../comun/seccion-prediccion"
import { EsqueletoFilas, EstadoError, EstadoVacio } from "../comun/estados-bloque"
import { GrupoClientas } from "./grupo-clientas"

interface SeccionClientasProps {
  data: RfmSegmentosResponse | null
  isLoading: boolean
  error: string | null
  onReintentar: () => void
}

/** "Tus clientas": 4 grupos con nombres humanos según cómo compran, y qué hacer con cada uno. */
export function SeccionClientas({ data, isLoading, error, onReintentar }: SeccionClientasProps) {
  const { user } = useAuth()
  const grupos = useMemo(() => armarGruposClientas(data), [data])
  const total = data?.total_clientas ?? 0
  const dormidas = grupos.find((g) => g.id === "EN_RIESGO_DORMIDAS")?.cantidad ?? 0

  const frase = data && total > 0
    ? `Agrupamos a tus ${contar(total, "clienta", "clientas")} según cuándo, cuánto y qué tan seguido compran.${
        dormidas > 0 ? ` ${dormidas === 1 ? "Una dejó" : `${dormidas} dejaron`} de comprar: es el grupo que más conviene recuperar.` : ""
      }`
    : undefined

  return (
    <SeccionPrediccion titulo="Tus clientas" frase={frase}>
      {isLoading && !data ? (
        <EsqueletoFilas filas={4} />
      ) : error && !data ? (
        <EstadoError que="los grupos de clientas" onReintentar={onReintentar} />
      ) : total === 0 ? (
        <EstadoVacio icono={UsersThree} titulo="Todavía no hay clientas con compras">
          Cuando tus clientas empiecen a comprar, acá las vas a ver agrupadas para saber a quién cuidar y a quién recuperar.
        </EstadoVacio>
      ) : (
        <ul className="divide-y divide-border/70">
          {grupos.map((g) => (
            <GrupoClientas key={g.id} grupo={g} puedeCrearCupon={user?.role === "ADMIN"} />
          ))}
        </ul>
      )}
    </SeccionPrediccion>
  )
}
