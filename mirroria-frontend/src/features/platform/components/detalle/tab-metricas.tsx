import { ArrowClockwise, CalendarCheck, CoatHanger, Receipt, ShoppingBag, UserCircle, Users, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatFecha } from "@/lib/fechas"
import { formatMoney } from "@/lib/money"
import { useMetricasTienda } from "../../hooks/useMetricasTienda"
import { mesAnterior, variacion } from "../../lib/indicadores"
import { KpiCard, type Kpi } from "../dashboard/kpi-card"
import { GraficoVentas30d } from "./grafico-ventas-30d"

/** Solo agregados de la tienda (privacidad D7: totales sí, filas nunca). */
export function TabMetricas({ id }: { id: string }) {
  const { data: m, isLoading, error, reload } = useMetricasTienda(id)
  if (isLoading) return <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-28 rounded-xl" />)}</div>
  if (error || !m) {
    return (
      <Alert variant="destructive">
        <WarningCircle weight="fill" />
        <AlertDescription>{error ?? "Sin métricas"}</AlertDescription>
        <AlertAction><Button size="sm" variant="outline" onClick={reload} className="gap-1.5"><ArrowClockwise /> Reintentar</Button></AlertAction>
      </Alert>
    )
  }
  const kpis: Kpi[] = [
    { titulo: "Ventas del mes", valor: String(m.ventasMes.cantidad), icono: ShoppingBag, detalle: "", variacion: variacion(m.ventasMes.cantidad, m.ventasMesAnterior.cantidad, mesAnterior()) },
    { titulo: "Monto del mes", valor: formatMoney(m.ventasMes.montoCents), icono: Receipt, detalle: `${formatMoney(m.ventasMesAnterior.montoCents)} el mes anterior` },
    { titulo: "Ticket promedio", valor: formatMoney(m.ticketPromedioCents), icono: Receipt, detalle: m.ultimaVentaAt ? `Última venta: ${formatFecha(m.ultimaVentaAt)}` : "Sin ventas todavía" },
    { titulo: "Reservas del mes", valor: String(m.reservasMes), icono: CalendarCheck, detalle: "Para probarse en sucursal" },
    { titulo: "Prendas activas", valor: String(m.productosActivos), icono: CoatHanger, detalle: `${m.sucursalesActivas} ${m.sucursalesActivas === 1 ? "sucursal activa" : "sucursales activas"}` },
    { titulo: "Equipo", valor: String(m.usuariosStaff), icono: Users, detalle: "Cuentas de staff" },
    { titulo: "Clientas", valor: String(m.clientas), icono: UserCircle, detalle: "Cuentas registradas" },
  ]
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{kpis.map((k) => <KpiCard key={k.titulo} k={k} />)}</div>
      <GraficoVentas30d datos={m.ventasPorDia} />
    </div>
  )
}
