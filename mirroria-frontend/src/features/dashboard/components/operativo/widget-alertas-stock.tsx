import { ArrowRight, WarningDiamond } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { AlertaStockItemDto } from "../../types/dashboard.types"

interface WidgetAlertasStockProps {
  alertas?: AlertaStockItemDto[]
  isLoading?: boolean
}

export function WidgetAlertasStock({ alertas, isLoading }: WidgetAlertasStockProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Card className="h-96 p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </Card>
    )
  }

  const sinAlertas = !alertas || alertas.length === 0

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WarningDiamond className="size-5 text-amber-500" weight="duotone" />
            <CardTitle className="text-base font-semibold">Stock Crítico en Percha</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">{alertas?.length ?? 0} alertas</Badge>
        </div>
        <CardDescription className="text-xs">Prendas con quiebre de stock en tu local</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5">
        {sinAlertas ? (
          <div className="flex h-56 flex-col items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            ¡Perchero abastecido! No hay alertas de stock bajo.
          </div>
        ) : (
          alertas.map((a) => (
            <div
              key={a.inventarioId}
              className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs bg-card/60 hover:bg-muted/30 transition-colors"
            >
              <div className="space-y-0.5 min-w-0">
                <p className="font-semibold text-foreground truncate">{a.productoNombre}</p>
                <p className="text-[11px] text-muted-foreground">
                  Talla: <span className="text-foreground font-medium">{a.talla}</span> · Color:{" "}
                  <span className="text-foreground font-medium">{a.color}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={a.nivel === "AGOTADO" ? "destructive" : "outline"}
                  className={a.nivel === "CRITICO" ? "border-amber-500/30 text-amber-600 bg-amber-500/10" : ""}
                >
                  {a.stockDisponible} disp ({a.nivel})
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <div className="p-3 border-t border-border/60 bg-muted/20 flex justify-end">
        <Button
          size="xs"
          variant="ghost"
          className="gap-1 text-xs text-primary"
          onClick={() => navigate("/admin/inventario")}
        >
          Gestionar inventario <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </Card>
  )
}
