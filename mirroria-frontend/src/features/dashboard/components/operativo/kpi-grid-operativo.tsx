import { CalendarBlank, ClockCountdown, Money, WarningCircle } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import type { KpisOperativoDto } from "../../types/dashboard.types"
import { KpiCard } from "../shared/kpi-card"

interface KpiGridOperativoProps {
  kpis?: KpisOperativoDto
  isLoading?: boolean
}

export function KpiGridOperativo({ kpis, isLoading }: KpiGridOperativoProps) {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Ventas de Hoy"
        value={kpis ? `Bs ${kpis.ventas.montoBs.toLocaleString("es-BO", { minimumFractionDigits: 2 })}` : "Bs 0.00"}
        subtitle={kpis ? `${kpis.ventas.cantidadTickets} tickets emitidos · Prom: Bs ${kpis.ventas.ticketPromedioBs.toFixed(2)}` : undefined}
        icon={Money}
        isLoading={isLoading}
        onClick={() => navigate("/admin/ventas")}
      />

      <KpiCard
        title="Cobros Pendientes"
        value={kpis ? `${kpis.cobrosPendientes.cantidad} en espera` : "0"}
        subtitle={kpis ? `Total estimado: Bs ${kpis.cobrosPendientes.montoEstimadoBs.toFixed(2)}` : undefined}
        badgeText={kpis && kpis.cobrosPendientes.cantidad > 0 ? "Atención" : undefined}
        badgeVariant="destructive"
        icon={ClockCountdown}
        isLoading={isLoading}
        onClick={() => navigate("/admin/cobros")}
      />

      <KpiCard
        title="Reservas del Día"
        value={kpis ? `${kpis.reservas.porLlegar} por llegar` : "0"}
        subtitle={kpis ? `${kpis.reservas.enTienda} en tienda · ${kpis.reservas.completadas} completadas` : undefined}
        icon={CalendarBlank}
        isLoading={isLoading}
        onClick={() => navigate("/admin/reservas")}
      />

      <KpiCard
        title="Stock Crítico"
        value={kpis ? `${kpis.stock.criticos} críticos` : "0"}
        subtitle={kpis ? `${kpis.stock.agotados} prendas agotadas en local` : undefined}
        badgeText={kpis && kpis.stock.agotados > 0 ? "Agotados" : undefined}
        badgeVariant="destructive"
        icon={WarningCircle}
        isLoading={isLoading}
        onClick={() => navigate("/admin/inventario")}
      />
    </div>
  )
}
