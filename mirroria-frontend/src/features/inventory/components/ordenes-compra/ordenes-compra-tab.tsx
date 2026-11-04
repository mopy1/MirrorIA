import { useState } from "react"
import { Plus } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { branchesApi } from "@/features/branches/api/branchesApi"
import { providersApi } from "@/features/providers/api/providersApi"
import { useResourceList } from "@/hooks/useResourceList"
import { purchaseOrdersApi } from "../../api/purchaseOrdersApi"
import type { OrdenCompra } from "../../types/purchase-orders.types"
import { CrearOrdenCompraDialog } from "./crear-orden-compra-dialog"
import { OrdenesCompraTable } from "./ordenes-compra-table"
import { OrdenesKpiBar } from "./ordenes-kpi-bar"
import { RecibirOrdenDialog } from "./recibir-orden-dialog"

interface Props {
  onStockUpdated?: () => void
}

export function OrdenesCompraTab({ onStockUpdated }: Props) {
  const ordenes = useResourceList(purchaseOrdersApi.getOrdenes)
  const proveedores = useResourceList(providersApi.getProveedores)
  const sucursales = useResourceList(branchesApi.getSucursales)

  const [isCrearOpen, setIsCrearOpen] = useState(false)
  const [ordenParaRecibir, setOrdenParaRecibir] = useState<OrdenCompra | null>(null)

  const isLoading = ordenes.isLoading || proveedores.isLoading || sucursales.isLoading

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Órdenes a Proveedores</h2>
          <p className="text-xs text-muted-foreground">
            Gestión de abastecimiento, envíos en tránsito y recepción de prendas.
          </p>
        </div>
        <Button onClick={() => setIsCrearOpen(true)} className="gap-1.5 self-start sm:self-auto">
          <Plus data-icon="inline-start" />
          Nueva orden de compra
        </Button>
      </div>

      <OrdenesKpiBar ordenes={ordenes.items} />

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {ordenes.error && (
        <Alert variant="destructive">
          <AlertDescription>{ordenes.error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !ordenes.error && (
        <OrdenesCompraTable
          ordenes={ordenes.items}
          proveedores={proveedores.items}
          sucursales={sucursales.items}
          onRecibir={setOrdenParaRecibir}
          onNuevaOrden={() => setIsCrearOpen(true)}
        />
      )}

      <CrearOrdenCompraDialog
        open={isCrearOpen}
        onOpenChange={setIsCrearOpen}
        proveedores={proveedores.items}
        sucursales={sucursales.items}
        onSuccess={ordenes.reload}
      />

      <RecibirOrdenDialog
        orden={ordenParaRecibir}
        open={Boolean(ordenParaRecibir)}
        onOpenChange={(open) => !open && setOrdenParaRecibir(null)}
        onSuccess={() => {
          ordenes.reload()
          onStockUpdated?.()
        }}
      />
    </div>
  )
}
