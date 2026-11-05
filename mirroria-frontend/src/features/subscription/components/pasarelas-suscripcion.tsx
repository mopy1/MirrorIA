import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePasarelas } from "@/features/payments/hooks/usePasarelas"
import type { PasarelaId } from "@/features/payments/types/pasarelas.types"
import { PasarelaItem } from "./pasarela-item"

interface PasarelasSuscripcionProps {
  onSeleccionar: (pasarelaId: PasarelaId) => void
  disabled?: boolean
}

export function PasarelasSuscripcion({ onSeleccionar, disabled }: PasarelasSuscripcionProps) {
  const { pasarelas, isLoading, error, reload } = usePasarelas("suscripcion")

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Elegí cómo pagar</h2>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      {error && !isLoading && (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{error}</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={reload} className="gap-1.5">
              <ArrowClockwise /> Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {!isLoading && !error && pasarelas.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          No hay pasarelas de pago disponibles en este momento.
        </div>
      )}

      {!isLoading && !error && pasarelas.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border/60 bg-card">
          {pasarelas.map((p) => (
            <PasarelaItem
              key={p.id}
              pasarela={p}
              disabled={disabled}
              onClick={() => onSeleccionar(p.id)}
            />
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">
        El pago reactiva o extiende tu membresía SaaS por 1 mes calendario.
      </p>
    </section>
  )
}
