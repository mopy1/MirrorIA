import { CreditCard } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/** Hook visual de la Fase 2: el pago de la suscripción llega con las pasarelas. */
export function PagarSuscripcionCta() {
  return (
    <Button variant="outline" disabled className="gap-2" title="El pago de la suscripción llega con las pasarelas de pago">
      <CreditCard /> Pagar suscripción
      <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
        Próximamente
      </Badge>
    </Button>
  )
}
