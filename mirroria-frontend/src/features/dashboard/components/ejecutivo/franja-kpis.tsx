import { formatearMontoBs, formatearMontoRedondo } from "../../lib/dashboard.utils"
import { describirVariacion } from "../../lib/variacion"
import type { DashboardEjecutivoDto } from "../../types/dashboard.types"
import { KpiItem } from "../shared/kpi-item"

/** El ritmo se dice en palabras y con color semántico (nunca "0.10x"). */
const RITMO: Record<string, { etiqueta: string; clase: string }> = {
  LENTA: { etiqueta: "Lento", clase: "text-amber-700" },
  SALUDABLE: { etiqueta: "A buen ritmo", clase: "text-emerald-700" },
  ALTA: { etiqueta: "Rápido", clase: "text-emerald-700" },
}

/** Las cifras del período con jerarquía: lo vendido manda, el resto acompaña. */
export function FranjaKpis({ data, compras, isLoading }: { data?: DashboardEjecutivoDto | null; compras: number; isLoading?: boolean }) {
  const k = data?.kpis
  const cargando = isLoading || !k
  const ingresosAnt = (k?.ingresos.anteriorMontoCents ?? 0) / 100
  const ticketAnt = (k?.ticketPromedio.anteriorMontoCents ?? 0) / 100
  const rot = k?.rotacionInventario
  const conv = k?.conversionReservas

  return (
    <section
      aria-label="Cifras del período"
      className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)]"
    >
      <KpiItem
        principal
        className="sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:justify-center"
        titulo="Lo que vendiste"
        ayuda="Todo lo que cobraste por ventas pagadas o entregadas en estas fechas."
        isLoading={cargando}
        valor={k ? formatearMontoBs(k.ingresos.montoBs) : ""}
        variacion={k ? describirVariacion(k.ingresos.montoBs, ingresosAnt, k.ingresos.variacionPorcentaje) : undefined}
        detalle={k ? `En ${compras} ${compras === 1 ? "compra" : "compras"} · antes: ${formatearMontoRedondo(ingresosAnt)}` : undefined}
      />
      <KpiItem
        titulo="Gasto promedio por compra"
        ayuda="Cuánto gasta en promedio una clienta cada vez que te compra: lo vendido dividido entre la cantidad de compras."
        isLoading={cargando}
        valor={k ? formatearMontoBs(k.ticketPromedio.montoBs) : ""}
        variacion={k ? describirVariacion(k.ticketPromedio.montoBs, ticketAnt, k.ticketPromedio.variacionPorcentaje) : undefined}
      />
      <KpiItem
        titulo="Clientas que compraron"
        ayuda="Personas distintas que hicieron al menos una compra en estas fechas."
        isLoading={cargando}
        valor={k?.clientesActivos.cantidad ?? 0}
        variacion={
          k
            ? describirVariacion(k.clientesActivos.cantidad, k.clientesActivos.anteriorCantidad, k.clientesActivos.variacionPorcentaje, {
                textoSinAnterior: "Nadie había comprado en el período anterior",
              })
            : undefined
        }
      />
      <KpiItem
        titulo="Qué tan rápido se vende tu stock"
        ayuda="Compara cuántas prendas vendiste con cuántas tenés disponibles. Si es lento, hay mucha ropa quieta en la percha."
        isLoading={cargando}
        valor={rot ? <span className={RITMO[rot.interpretacion]?.clase}>{RITMO[rot.interpretacion]?.etiqueta ?? "Sin dato"}</span> : ""}
        detalle={rot ? `Se vendieron ${rot.unidadesVendidas} de ${rot.stockTotalDisponible} prendas disponibles` : undefined}
      />
      <KpiItem
        titulo="Reservas que terminaron en compra"
        ayuda="Clientas que apartaron prendas para probarse en la tienda y terminaron comprando. Solo cuentan las reservas ya cerradas."
        isLoading={cargando}
        valor={conv ? `${conv.reservasConVenta} de ${conv.totalReservasCerradas}` : ""}
        detalle={conv && conv.totalReservasCerradas === 0 ? "Todavía no hay reservas cerradas en estas fechas" : "reservas cerradas en estas fechas"}
      />
    </section>
  )
}
