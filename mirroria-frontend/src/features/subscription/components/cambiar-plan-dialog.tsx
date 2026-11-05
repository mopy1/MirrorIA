import { useState } from "react"
import { CheckCircle, CircleNotch, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useResourceList } from "@/hooks/useResourceList"
import { FILAS_LIMITES, formatLimite } from "@/lib/limites-plan"
import { formatMoneyEntero } from "@/lib/money"
import { cn } from "cn"
import { suscripcionApi } from "../api/suscripcionApi"
import { useCambiarPlan } from "../hooks/useCambiarPlan"
import type { MiSuscripcionDto } from "../types/suscripcion.types"

interface CambiarPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actual: string
  onCambiado: (nuevo: MiSuscripcionDto) => void
}

/** Cambio de plan durante la prueba (sin cobro). El 409 de uso > límites se muestra tal cual.
 * El padre lo remonta al abrir (`key`), así arranca con el plan actual y sin error. */
export function CambiarPlanDialog({ open, onOpenChange, actual, onCambiado }: CambiarPlanDialogProps) {
  const planes = useResourceList(suscripcionApi.getPlanes)
  const [elegido, setElegido] = useState(actual)
  const { cambiar, isLoading, error } = useCambiarPlan(onCambiado)

  async function confirmar() {
    if (await cambiar(elegido)) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambiar de plan</DialogTitle>
          <DialogDescription>Durante la prueba gratis podés cambiar de plan las veces que quieras.</DialogDescription>
        </DialogHeader>
        <div role="radiogroup" className="grid gap-2">
          {planes.isLoading && <p className="text-sm text-muted-foreground">Cargando planes...</p>}
          {planes.error && <p className="text-sm text-destructive">{planes.error}</p>}
          {planes.items.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.codigo === elegido}
              onClick={() => setElegido(p.codigo)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors",
                p.codigo === elegido ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40",
              )}
            >
              <CheckCircle weight={p.codigo === elegido ? "fill" : "regular"} className={cn("mt-0.5 size-4 shrink-0", p.codigo === elegido ? "text-primary" : "text-muted-foreground")} />
              <span className="flex-1">
                <span className="flex justify-between font-medium">
                  {p.nombre} {p.codigo === actual && "(actual)"}
                  <span>{formatMoneyEntero(p.precioMensualCents)}/mes</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {FILAS_LIMITES.map((f) => formatLimite(p.limites[f.clave], f.singular, f.plural)).join(" · ")}
                </span>
              </span>
            </button>
          ))}
        </div>
        {error && (
          <Alert variant="destructive">
            <WarningCircle weight="fill" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={confirmar} disabled={isLoading || elegido === actual} className="gap-2">
            {isLoading && <CircleNotch className="size-4 animate-spin" />}
            {isLoading ? "Cambiando..." : "Confirmar cambio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
