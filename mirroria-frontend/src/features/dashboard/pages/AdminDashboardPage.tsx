import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ChartLineUp, Desktop } from "@phosphor-icons/react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { DashboardEjecutivoView } from "../components/ejecutivo/dashboard-ejecutivo-view"
import { DashboardOperativoView } from "../components/operativo/dashboard-operativo-view"
import { useDashboardEjecutivo } from "../hooks/useDashboardEjecutivo"
import { useDashboardOperativo } from "../hooks/useDashboardOperativo"
import type { PeriodoDashboard } from "../types/dashboard.types"

export function AdminDashboardPage() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const esAdmin = user?.role === "ADMIN"

  const [modoAdmin, setModoAdmin] = useState<"ejecutivo" | "operativo">(
    searchParams.get("modo") === "operativo" ? "operativo" : "ejecutivo",
  )
  const [periodo, setPeriodo] = useState<PeriodoDashboard>("30d")
  const [sucursalId, setSucursalId] = useState<string | undefined>()

  const esVistaEjecutiva = esAdmin && modoAdmin === "ejecutivo"

  const {
    data: dataEjecutiva,
    isLoading: loadingEjecutivo,
  } = useDashboardEjecutivo({
    periodo,
    sucursalId,
    enabled: esVistaEjecutiva,
  })

  const {
    data: dataOperativa,
    isLoading: loadingOperativo,
    recargar: recargarOperativo,
  } = useDashboardOperativo({
    sucursalId: esAdmin ? sucursalId : undefined,
    enabled: !esVistaEjecutiva,
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {esAdmin && (
        <div className="flex justify-end">
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5 shadow-xs">
            <Button
              size="xs"
              variant={modoAdmin === "ejecutivo" ? "default" : "ghost"}
              onClick={() => setModoAdmin("ejecutivo")}
              className="gap-1.5 text-xs"
            >
              <ChartLineUp className="size-3.5" weight="bold" />
              Vista Ejecutiva BI
            </Button>
            <Button
              size="xs"
              variant={modoAdmin === "operativo" ? "default" : "ghost"}
              onClick={() => setModoAdmin("operativo")}
              className="gap-1.5 text-xs"
            >
              <Desktop className="size-3.5" weight="bold" />
              Inspección POS
            </Button>
          </div>
        </div>
      )}

      {esVistaEjecutiva ? (
        <DashboardEjecutivoView
          periodo={periodo}
          sucursalId={sucursalId}
          onPeriodoChange={setPeriodo}
          onSucursalChange={setSucursalId}
          data={dataEjecutiva}
          isLoading={loadingEjecutivo}
        />
      ) : (
        <DashboardOperativoView
          data={dataOperativa}
          isLoading={loadingOperativo}
          onRecargar={recargarOperativo}
        />
      )}
    </div>
  )
}

export const DashboardAdminPage = AdminDashboardPage
