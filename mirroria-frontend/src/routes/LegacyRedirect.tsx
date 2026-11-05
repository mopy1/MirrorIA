import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { rutaLegacy, SLUG_DEMO } from "@/lib/rutas-tienda"

/**
 * Rutas de antes del SaaS (`/tienda`, `/carrito`, `/pago/exito?venta=…`, …):
 * redirige a la misma ruta dentro de la tienda de la sesión o de la demo,
 * conservando la query. Así siguen andando los links viejos y los retornos
 * de Stripe/Wayra (`PAGOS_URL_EXITO`/`PAGOS_URL_CANCELACION`) sin tocar el env.
 */
export function LegacyRedirect() {
  const { pathname, search } = useLocation()
  const { user } = useAuth()
  return <Navigate to={rutaLegacy(user?.tenant?.slug ?? SLUG_DEMO, pathname, search)} replace />
}
