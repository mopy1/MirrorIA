import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { useTienda } from "@/hooks/useTienda"
import { destinoTrasLogin } from "@/lib/destino-sesion"

/**
 * Solo para visitantes. Dentro de `/t/:slug` cuenta la sesión de ESA tienda
 * (con sesión de otra se puede entrar acá); fuera (alta de tienda, login de
 * plataforma) cualquier sesión manda a su destino de siempre.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { slug } = useTienda()
  const enTienda = useSesionEnTienda()
  const sesion = slug ? enTienda : user
  if (sesion) return <Navigate to={destinoTrasLogin(sesion)} replace />
  return children
}
