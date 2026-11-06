import { Skeleton } from "@/components/ui/skeleton"
import { formatearMontoBs } from "../../lib/dashboard.utils"
import { agruparPagosPorMetodo } from "../../lib/metodos-pago"
import type { DistribucionPagoDto } from "../../types/dashboard.types"
import { Seccion, VacioUtil } from "../shared/seccion"

const TITULO = "Cómo te pagan"

/** Barra apilada horizontal (HTML) + leyenda con nombres humanos y cifras siempre visibles. */
export function ComoTePagan({ pagos, isLoading }: { pagos?: DistribucionPagoDto[]; isLoading?: boolean }) {
  if (isLoading || !pagos) {
    return (
      <Seccion titulo={TITULO}>
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="mt-5 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </Seccion>
    )
  }

  const metodos = agruparPagosPorMetodo(pagos).filter((m) => m.montoBs > 0)
  if (metodos.length === 0) {
    return (
      <Seccion titulo={TITULO}>
        <VacioUtil texto="Cuando cobres ventas en estas fechas, aquí vas a ver cuánto entró en efectivo, con tarjeta y por QR." />
      </Seccion>
    )
  }

  const principal = [...metodos].sort((a, b) => b.montoBs - a.montoBs)[0]
  return (
    <Seccion titulo={TITULO} descripcion={`La mayor parte entró con ${principal.nombre.toLowerCase()} (${principal.porcentaje}%).`}>
      <div className="flex h-3 w-full gap-0.5" role="img" aria-label={metodos.map((m) => `${m.nombre} ${m.porcentaje}%`).join(", ")}>
        {metodos.map((m) => (
          <div
            key={m.clave}
            className="h-full min-w-1 basis-0 rounded-[4px] first:rounded-l-full last:rounded-r-full"
            style={{ flexGrow: m.montoBs, backgroundColor: m.color }}
            title={`${m.nombre}: ${formatearMontoBs(m.montoBs)}`}
          />
        ))}
      </div>
      <ul className="mt-5 flex flex-col gap-3">
        {metodos.map((m) => (
          <li key={m.clave} className="flex items-start justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: m.color }} aria-hidden />
              <span className="font-medium text-foreground">{m.nombre}</span>
            </span>
            <span className="text-right tabular-nums">
              <span className="font-semibold text-foreground">{formatearMontoBs(m.montoBs)}</span>
              <span className="block text-xs text-muted-foreground">
                {m.porcentaje}% · {m.transacciones} {m.transacciones === 1 ? "cobro" : "cobros"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Seccion>
  )
}
