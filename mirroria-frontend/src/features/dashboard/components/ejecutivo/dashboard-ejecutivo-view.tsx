import { Skeleton } from "@/components/ui/skeleton"
import { describirRango } from "../../lib/fechas-dashboard"
import { contarCompras } from "../../lib/resumen-negocio"
import type { DashboardEjecutivoDto } from "../../types/dashboard.types"
import { BloqueError } from "../shared/bloque-error"
import { EncabezadoDashboard, type CambioModo } from "../shared/encabezado-dashboard"
import { BarraFiltros, type BarraFiltrosProps } from "./barra-filtros"
import { ComoTePagan } from "./como-te-pagan"
import { FranjaKpis } from "./franja-kpis"
import { GraficoIngresosDia } from "./grafico-ingresos-dia"
import { PrendasMasVendidas, ProveedoresTop } from "./rankings-ventas"
import { ResumenNegocio } from "./resumen-negocio"
import { UsoPlan } from "./uso-plan"

interface DashboardEjecutivoViewProps {
  filtros: Omit<BarraFiltrosProps, "isLoading" | "onRefrescar">
  data: DashboardEjecutivoDto | null
  isLoading: boolean
  error: string | null
  onRecargar: () => void
  modo?: CambioModo
}

/** "Resumen del negocio": primero la conclusión en palabras, después el detalle. */
export function DashboardEjecutivoView({ filtros, data, isLoading, error, onRecargar, modo }: DashboardEjecutivoViewProps) {
  const cargando = isLoading || (!data && !error)
  const g = data?.graficos
  const rango = data && !isLoading ? describirRango(data.periodo) : null

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoDashboard titulo="Resumen del negocio" modo={modo} />
      <div className="flex flex-col gap-2">
        <BarraFiltros {...filtros} isLoading={isLoading} onRefrescar={onRecargar} />
        {rango ? (
          <p className="text-xs text-muted-foreground tabular-nums">{rango}</p>
        ) : (
          !error && <Skeleton className="h-3.5 w-64 max-w-full" />
        )}
      </div>

      {error && !isLoading ? (
        <BloqueError onReintentar={onRecargar} />
      ) : (
        <>
          <ResumenNegocio data={data} isLoading={cargando} />
          <FranjaKpis data={data} compras={data ? contarCompras(data) : 0} isLoading={cargando} />
          <GraficoIngresosDia dias={g?.tendenciaIngresos} isLoading={cargando} />
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <PrendasMasVendidas prendas={g?.topPrendas} isLoading={cargando} />
            </div>
            <div className="flex min-w-0 flex-col gap-5">
              <ComoTePagan pagos={g?.distribucionPagos} isLoading={cargando} />
              <ProveedoresTop proveedores={g?.topProveedores} isLoading={cargando} />
            </div>
          </div>
          <UsoPlan plan={data?.planSaaS} isLoading={cargando} />
        </>
      )}
    </div>
  )
}
