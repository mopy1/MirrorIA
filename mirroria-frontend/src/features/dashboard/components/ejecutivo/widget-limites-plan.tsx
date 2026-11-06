import { Crown, Sparkle } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { LimiteRecursoPlanDto, PlanSaaSEjecutivoDto } from "../../types/dashboard.types"
import { cn } from "cn"

interface WidgetLimitesPlanProps {
  planSaaS?: PlanSaaSEjecutivoDto
  isLoading?: boolean
}

function ItemLimite({ label, limite }: { label: string; limite?: LimiteRecursoPlanDto }) {
  const pct = limite?.porcentaje ?? 0
  const esAlerta = pct >= 80

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {limite?.actual ?? 0} {limite?.maximo ? `/ ${limite.maximo}` : "(Ilimitado)"}
          {limite?.maximo && ` (${pct}%)`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            esAlerta ? "bg-amber-500" : "bg-primary",
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

export function WidgetLimitesPlan({ planSaaS, isLoading }: WidgetLimitesPlanProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-5 w-48 mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    )
  }

  if (!planSaaS) return null

  return (
    <Card className="p-4 bg-linear-to-r from-card via-card to-primary/5">
      <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="size-5 text-amber-500" weight="fill" />
          <CardTitle className="text-sm font-semibold">
            Suscripción: {planSaaS.planNombre}
          </CardTitle>
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
            {planSaaS.diasRestantes} días restantes
          </Badge>
        </div>
        <Button
          variant="outline"
          size="xs"
          className="text-xs gap-1"
          onClick={() => navigate("/admin/suscripcion")}
        >
          <Sparkle className="size-3 text-primary" weight="fill" />
          Gestionar plan
        </Button>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 gap-4">
        <ItemLimite label="Productos en Catálogo" limite={planSaaS.limites.productos} />
        <ItemLimite label="Sucursales Activas" limite={planSaaS.limites.sucursales} />
        <ItemLimite label="Usuarios Staff" limite={planSaaS.limites.usuariosStaff} />
      </CardContent>
    </Card>
  )
}
