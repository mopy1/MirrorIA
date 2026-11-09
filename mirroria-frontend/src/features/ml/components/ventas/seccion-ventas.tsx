import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Receipt } from "@phosphor-icons/react"
import { buttonVariants } from "@/components/ui/button"
import { formatMoney } from "@/lib/money"
import { cn } from "cn"
import type { AnomaliasVentasResponse } from "../../types/ml.types"
import { contar } from "../../lib/ml-lenguaje"
import { SeccionPrediccion } from "../comun/seccion-prediccion"
import { EsqueletoFilas, EstadoError, EstadoVacio } from "../comun/estados-bloque"
import { FilaVenta } from "./fila-venta"

interface SeccionVentasProps {
  data: AnomaliasVentasResponse | null
  isLoading: boolean
  error: string | null
  onReintentar: () => void
}

const claseFiltro = (activo: boolean) =>
  cn(
    "rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring",
    activo ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
  )

/** "Ventas para revisar": las ventas recientes que no se parecen a las de siempre. */
export function SeccionVentas({ data, isLoading, error, onReintentar }: SeccionVentasProps) {
  const ventas = useMemo(() => data?.diagnosticos ?? [], [data])
  const inusuales = useMemo(() => ventas.filter((v) => v.es_anomalo), [ventas])
  const [soloInusuales, setSoloInusuales] = useState<boolean | null>(null)
  const filtrar = soloInusuales ?? inusuales.length > 0
  const lista = filtrar ? inusuales : ventas

  const frase = data && ventas.length > 0
    ? inusuales.length > 0
      ? `${contar(inusuales.length, "venta se ve inusual", "ventas se ven inusuales")} entre las últimas ${ventas.length} (${formatMoney(data.monto_sospechoso_cents)}). Confirmá con caja que estén bien.`
      : `Las últimas ${ventas.length} ventas se ven normales.`
    : undefined

  return (
    <SeccionPrediccion
      titulo="Ventas para revisar"
      frase={frase}
      accion={<Link to="/admin/ventas" className={buttonVariants({ variant: "outline", size: "sm" })}>Ir a Ventas</Link>}
    >
      {isLoading && !data ? (
        <EsqueletoFilas filas={4} />
      ) : error && !data ? (
        <EstadoError que="las ventas recientes" onReintentar={onReintentar} />
      ) : ventas.length === 0 ? (
        <EstadoVacio icono={Receipt} titulo="Todavía no hay ventas para revisar">
          Cada venta nueva se compara con las anteriores; si alguna se ve rara, aparece acá.
        </EstadoVacio>
      ) : (
        <>
          <div role="group" aria-label="Qué ventas mostrar" className="inline-flex rounded-lg bg-muted p-0.5">
            <button type="button" aria-pressed={filtrar} onClick={() => setSoloInusuales(true)} className={claseFiltro(filtrar)}>
              Inusuales ({inusuales.length})
            </button>
            <button type="button" aria-pressed={!filtrar} onClick={() => setSoloInusuales(false)} className={claseFiltro(!filtrar)}>
              Todas ({ventas.length})
            </button>
          </div>
          {lista.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Ninguna venta inusual: todo en orden.</p>
          ) : (
            <ul className="mt-1 divide-y divide-border/70">
              {lista.map((v) => <FilaVenta key={v.venta_id} venta={v} />)}
            </ul>
          )}
        </>
      )}
    </SeccionPrediccion>
  )
}
