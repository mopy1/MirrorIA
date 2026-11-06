import { DashboardEjecutivoView } from "../components/ejecutivo/dashboard-ejecutivo-view"
import { DashboardOperativoView } from "../components/operativo/dashboard-operativo-view"
import { SelectorSucursal } from "../components/shared/selector-sucursal"
import { useDashboardPage } from "../hooks/useDashboardPage"

/** Inicio del panel: "Resumen del negocio" (solo ADMIN) y "Hoy en la tienda" (todo el staff). */
export function AdminDashboardPage() {
  const { rol, esAdmin, modo, cambiarModo, filtros, ejecutivo, operativo } = useDashboardPage()
  const cambio = esAdmin ? { actual: modo, onCambiar: cambiarModo } : undefined

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {modo === "resumen" ? (
        <DashboardEjecutivoView
          modo={cambio}
          filtros={{
            periodo: filtros.periodo,
            fechaInicio: filtros.fechaInicio,
            fechaFin: filtros.fechaFin,
            sucursalId: filtros.sucursalId,
            onPeriodoChange: filtros.setPeriodo,
            onFechaInicioChange: filtros.setFechaInicio,
            onFechaFinChange: filtros.setFechaFin,
            onSucursalChange: filtros.setSucursalId,
          }}
          data={ejecutivo.data}
          isLoading={ejecutivo.isLoading}
          error={ejecutivo.error}
          onRecargar={ejecutivo.recargar}
        />
      ) : (
        <DashboardOperativoView
          modo={cambio}
          rol={rol}
          data={operativo.data}
          isLoading={operativo.isLoading}
          error={operativo.error}
          onRecargar={operativo.recargar}
          sucursalSelector={
            esAdmin ? <SelectorSucursal sucursalId={filtros.sucursalId} onSucursalChange={filtros.setSucursalId} /> : undefined
          }
        />
      )}
    </div>
  )
}

export const DashboardAdminPage = AdminDashboardPage
