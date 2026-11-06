import { ArrowsClockwise, CheckCircle, CurrencyCircleDollar, Receipt, Users } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import type { KpisEjecutivosDto } from "../../types/dashboard.types"
import { KpiCard } from "../shared/kpi-card"

interface KpiGridEjecutivoProps {
  kpis?: KpisEjecutivosDto
  isLoading?: boolean
}

export function KpiGridEjecutivo({ kpis, isLoading }: KpiGridEjecutivoProps) {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <KpiCard
        title="Ingresos del Período"
        value={kpis ? `Bs ${kpis.ingresos.montoBs.toLocaleString("es-BO", { minimumFractionDigits: 2 })}` : "Bs 0.00"}
        delta={kpis?.ingresos.variacionPorcentaje}
        tendencia={kpis?.ingresos.tendencia}
        subtitle={kpis ? `Ant: Bs ${(kpis.ingresos.anteriorMontoCents / 100).toFixed(2)}` : undefined}
        icon={CurrencyCircleDollar}
        isLoading={isLoading}
        onClick={() => navigate("/admin/ventas")}
      />

      <KpiCard
        title="Ticket Promedio"
        value={kpis ? `Bs ${kpis.ticketPromedio.montoBs.toFixed(2)}` : "Bs 0.00"}
        delta={kpis?.ticketPromedio.variacionPorcentaje}
        tendencia={kpis?.ticketPromedio.tendencia}
        subtitle={kpis ? `Ant: Bs ${(kpis.ticketPromedio.anteriorMontoCents / 100).toFixed(2)}` : undefined}
        icon={Receipt}
        isLoading={isLoading}
        onClick={() => navigate("/admin/ventas")}
      />

      <KpiCard
        title="Rotación de Stock"
        value={kpis ? `${kpis.rotacionInventario.ratio.toFixed(2)}x` : "0.00x"}
        badgeText={kpis?.rotacionInventario.interpretacion}
        badgeVariant={
          kpis?.rotacionInventario.interpretacion === "SALUDABLE"
            ? "default"
            : kpis?.rotacionInventario.interpretacion === "ALTA"
              ? "secondary"
              : "destructive"
        }
        subtitle={kpis ? `${kpis.rotacionInventario.unidadesVendidas} vtas / ${kpis.rotacionInventario.stockTotalDisponible} disp` : undefined}
        icon={ArrowsClockwise}
        isLoading={isLoading}
        onClick={() => navigate("/admin/inventario")}
      />

      <KpiCard
        title="Conversión Reservas"
        value={kpis ? `${kpis.conversionReservas.tasaPorcentaje.toFixed(1)}%` : "0.0%"}
        delta={kpis?.conversionReservas.variacionPorcentaje}
        subtitle={kpis ? `${kpis.conversionReservas.reservasConVenta} de ${kpis.conversionReservas.totalReservasCerradas} cerradas` : undefined}
        icon={CheckCircle}
        isLoading={isLoading}
        onClick={() => navigate("/admin/reservas")}
      />

      <KpiCard
        title="Clientes Activos"
        value={kpis ? kpis.clientesActivos.cantidad : 0}
        delta={kpis?.clientesActivos.variacionPorcentaje}
        subtitle={kpis ? `Ant: ${kpis.clientesActivos.anteriorCantidad} compradoras` : undefined}
        icon={Users}
        isLoading={isLoading}
        onClick={() => navigate("/admin/reportes")}
      />
    </div>
  )
}
