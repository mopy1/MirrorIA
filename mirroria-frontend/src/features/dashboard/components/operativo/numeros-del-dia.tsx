import { formatearMontoBs } from "../../lib/dashboard.utils"
import type { KpisOperativoDto } from "../../types/dashboard.types"
import { KpiItem } from "../shared/kpi-item"

const n = (cant: number, uno: string, varios: string) => `${cant} ${cant === 1 ? uno : varios}`

/** Los 4 números del día, en lenguaje de mostrador. */
export function NumerosDelDia({ kpis, isLoading }: { kpis?: KpisOperativoDto; isLoading?: boolean }) {
  const cargando = isLoading || !kpis
  const v = kpis?.ventas
  const c = kpis?.cobrosPendientes
  const r = kpis?.reservas
  const s = kpis?.stock

  return (
    <section aria-label="Números de hoy" className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
      <KpiItem
        titulo="Vendido hoy"
        ayuda="Lo que se cobró hoy por ventas pagadas o entregadas en esta sucursal."
        isLoading={cargando}
        valor={v ? formatearMontoBs(v.montoBs) : ""}
        detalle={v ? (v.cantidadTickets > 0 ? `En ${n(v.cantidadTickets, "compra", "compras")}` : "Todavía sin ventas hoy") : undefined}
      />
      <KpiItem
        titulo="Cobros por confirmar"
        ayuda="Ventas que ya se hicieron pero cuyo pago todavía tenés que revisar y confirmar."
        isLoading={cargando}
        valor={c?.cantidad ?? 0}
        estado={c && c.cantidad > 0 ? { etiqueta: "Por revisar", tono: "atencion" } : undefined}
        detalle={c ? (c.cantidad > 0 ? `${formatearMontoBs(c.montoEstimadoBs)} esperando confirmación` : "Nada pendiente") : undefined}
      />
      <KpiItem
        titulo="Citas de hoy"
        ayuda="Clientas que reservaron prendas para venir a probárselas hoy."
        isLoading={cargando}
        valor={r ? `${r.porLlegar} por llegar` : ""}
        detalle={r ? `${r.enTienda} en la tienda · ${n(r.completadas, "completada", "completadas")}` : undefined}
      />
      <KpiItem
        titulo="Prendas por agotarse"
        ayuda="Combinaciones de talla y color que tienen 2 unidades o menos en esta sucursal."
        isLoading={cargando}
        valor={s?.criticos ?? 0}
        estado={s && s.agotados > 0 ? { etiqueta: n(s.agotados, "agotada", "agotadas"), tono: "mal" } : undefined}
        detalle={s ? (s.criticos + s.agotados > 0 ? "Conviene reponer pronto" : "Todo con stock") : undefined}
      />
    </section>
  )
}
