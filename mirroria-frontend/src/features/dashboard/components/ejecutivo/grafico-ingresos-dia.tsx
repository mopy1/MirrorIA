import { Skeleton } from "@/components/ui/skeleton"
import { formatearMontoBs } from "../../lib/dashboard.utils"
import { fechaCorta } from "../../lib/fechas-dashboard"
import type { TendenciaIngresoDiaDto } from "../../types/dashboard.types"
import { Seccion, VacioUtil } from "../shared/seccion"
import { GraficoIngresosArea } from "./grafico-ingresos-area"

interface GraficoIngresosDiaProps {
  dias?: TendenciaIngresoDiaDto[]
  isLoading?: boolean
}

const compras = (n: number) => `${n} ${n === 1 ? "compra" : "compras"}`

export function GraficoIngresosDia({ dias, isLoading }: GraficoIngresosDiaProps) {
  if (isLoading || !dias) {
    return (
      <Seccion titulo="Ventas por día">
        <Skeleton className="h-60 w-full rounded-lg" />
      </Seccion>
    )
  }

  const mejorDia = dias.reduce<TendenciaIngresoDiaDto | null>((mejor, d) => (!mejor || d.ingresosBs > mejor.ingresosBs ? d : mejor), null)
  const sinVentas = !mejorDia || mejorDia.ingresosBs <= 0

  if (sinVentas) {
    return (
      <Seccion titulo="Ventas por día">
        <VacioUtil texto="No hubo ventas en estas fechas. Probá con un período más largo, o registrá una venta para empezar a ver cómo se mueve tu tienda día a día." />
      </Seccion>
    )
  }

  if (dias.length < 2) {
    return (
      <Seccion titulo="Ventas por día">
        <p className="text-sm text-foreground tabular-nums">
          Hoy llevás {formatearMontoBs(mejorDia.ingresosBs)} en {compras(mejorDia.ventas)}.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Elegí 7 días o más para ver cómo cambian tus ventas de un día a otro.</p>
      </Seccion>
    )
  }

  const mejor = `Tu mejor día fue el ${fechaCorta(mejorDia.fecha)}: ${formatearMontoBs(mejorDia.ingresosBs)} en ${compras(mejorDia.ventas)}.`
  return (
    <Seccion titulo="Ventas por día" descripcion={mejor}>
      <GraficoIngresosArea dias={dias} mejorDia={mejorDia} resumenAccesible={`Gráfico de ventas por día. ${mejor}`} />
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          Ver los números de cada día
        </summary>
        <ul className="mt-2 grid max-h-48 grid-cols-1 gap-x-6 gap-y-1 overflow-y-auto sm:grid-cols-2">
          {dias.map((d) => (
            <li key={d.fecha} className="flex justify-between gap-3 tabular-nums">
              <span>{fechaCorta(d.fecha)}</span>
              <span className="text-foreground">
                {formatearMontoBs(d.ingresosBs)} · {compras(d.ventas)}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </Seccion>
  )
}
