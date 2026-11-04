import { useState } from "react"
import { Truck, Warehouse } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { branchesApi } from "@/features/branches/api/branchesApi"
import { OrdenesCompraTab } from "@/features/inventory/components/ordenes-compra"
import { useResourceList } from "@/hooks/useResourceList"
import { AjustarStockForm } from "../components/ajustar-stock-form"
import { StockTable } from "../components/stock-table"

export function InventarioAdminPage() {
  const sucursales = useResourceList(branchesApi.getSucursales)
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 flex flex-col gap-6 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Disponibilidad física por sucursal, ajustes manuales y reabastecimiento con proveedores.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-normal w-fit">
          <Warehouse className="size-3.5 text-muted-foreground" />
          <span>{sucursales.items.length} sucursales</span>
        </Badge>
      </div>

      <Tabs defaultValue="stock" className="flex flex-col gap-6">
        <TabsList className="p-1 gap-1">
          <TabsTrigger value="stock" className="gap-1.5 text-xs py-1.5 px-3">
            <Warehouse className="size-3.5" />
            Disponibilidad física
          </TabsTrigger>
          <TabsTrigger value="ordenes" className="gap-1.5 text-xs py-1.5 px-3">
            <Truck className="size-3.5" />
            Órdenes a Proveedores
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stock">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
            <StockTable sucursales={sucursales.items} reloadKey={reloadKey} />
            <AjustarStockForm
              sucursales={sucursales.items}
              onAjustado={() => setReloadKey((k) => k + 1)}
            />
          </div>
        </TabsContent>
        <TabsContent value="ordenes">
          <OrdenesCompraTab onStockUpdated={() => setReloadKey((k) => k + 1)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
