import { WarningCircle } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "cn"

/** El 409 de límite de plan siempre nombra al plan (spec §4.3): así se distingue de otros 409. */
export function esErrorDeLimite(mensaje: string): boolean {
  return /\bplan\b/i.test(mensaje)
}

/**
 * Muestra el `message` del backend. Si es un límite del plan, suma un botón
 * `outline` "Ver mi plan" → `/admin/suscripcion` (solo el ADMIN puede abrirla).
 */
export function ErrorConPlan({ mensaje, className }: { mensaje: string | null; className?: string }) {
  const { user } = useAuth()
  if (!mensaje) return null
  const verPlan = esErrorDeLimite(mensaje) && user?.role === "ADMIN"
  return (
    <Alert variant="destructive" className={cn("py-2 text-xs", className)}>
      <WarningCircle className="size-4" />
      <AlertDescription>
        {mensaje}
        {/* Debajo del texto y no como AlertAction absoluto: ese tapaba el final del mensaje. */}
        {verPlan && (
          <Link to="/admin/suscripcion" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 flex w-fit no-underline!")}>
            Ver mi plan
          </Link>
        )}
      </AlertDescription>
    </Alert>
  )
}
