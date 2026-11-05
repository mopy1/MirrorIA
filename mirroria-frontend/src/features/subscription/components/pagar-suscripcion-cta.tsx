import { CreditCard } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

/** Primario de "Plan y suscripción": lleva al checkout (`/admin/suscripcion/activar`). */
export function PagarSuscripcionCta() {
  return (
    <Link to="/admin/suscripcion/activar" className={cn(buttonVariants(), "gap-2")}>
      <CreditCard /> Activar plan
    </Link>
  )
}
