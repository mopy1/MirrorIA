import { CalendarCheck, Info } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"
import type { NoShowAgendaResponse } from "../../types/ml.types"
import { MlNoshowItem } from "./ml-noshow-item"

interface MlNoshowPanelProps {
  data?: NoShowAgendaResponse | null
  isLoading?: boolean
}

/** Panel lateral (35%): Guardián de Probador y Prevención de No-Show en tiempo real. */
export function MlNoshowPanel({ data, isLoading }: MlNoshowPanelProps) {
  const { user } = useAuth()
  const boutiqueNombre = user?.tenant?.nombre || "nuestra boutique"

  if (isLoading) {
    return (
      <Card className="p-5 space-y-4 shadow-xs">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </Card>
    )
  }

  const items = data?.evaluaciones ?? []
  const alertasCriticas = data?.alertas_criticas_count ?? 0

  return (
    <Card className="flex flex-col shadow-xs h-full">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <CalendarCheck className="size-5" weight="duotone" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Guardián de Probador
              </CardTitle>
              <CardDescription className="text-xs">
                Citas de hoy evaluadas por Cox (1958).
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] font-mono ${alertasCriticas > 0 ? "border-amber-500/40 bg-amber-500/10 text-amber-600" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"}`}
          >
            {alertasCriticas} en riesgo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
            <Info className="size-5 text-muted-foreground/60 mb-1" />
            <span>No hay citas registradas para hoy en la boutique.</span>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {items.map((it) => (
              <MlNoshowItem key={it.reserva_id} item={it} boutiqueNombre={boutiqueNombre} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
