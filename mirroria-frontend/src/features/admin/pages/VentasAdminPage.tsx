import { useMemo } from "react"
import { CurrencyDollar, Receipt, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { branchesApi } from "@/features/branches/api/branchesApi"
import { checkoutApi } from "@/features/checkout/api/checkoutApi"
import { useResourceList } from "@/hooks/useResourceList"
import { formatMoney } from "@/lib/money"
import { VentasTable } from "../components/ventas-table"

export function VentasAdminPage() {
  const ventas = useResourceList(() => checkoutApi.getVentas())
  const sucursales = useResourceList(branchesApi.getSucursales)

  const totalFacturado = useMemo(() => {
    return ventas.items.reduce((acc, v) => acc + v.totalCents, 0)
  }, [ventas.items])

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ventas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Historial de pedidos presenciales y digitales en todas las sucursales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-normal">
            <Receipt className="size-3.5 text-muted-foreground" />
            <span>{ventas.items.length} pedidos</span>
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 py-1 px-3 text-xs font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          >
            <CurrencyDollar className="size-3.5" />
            <span>{formatMoney(totalFacturado)} recaudado</span>
          </Badge>
        </div>
      </div>

      {ventas.error && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertDescription>{ventas.error}</AlertDescription>
        </Alert>
      )}

      {ventas.isLoading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <VentasTable ventas={ventas.items} sucursales={sucursales.items} />
      )}
    </div>
  )
}
