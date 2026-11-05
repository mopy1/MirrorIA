import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { useTienda } from "@/hooks/useTienda"
import { leerBienvenida } from "@/lib/bienvenida"
import { destinoTrasLogin } from "@/lib/destino-sesion"

/**
 * Solo para visitantes. Dentro de `/t/:slug` cuenta la sesión de ESA tienda
 * (con sesión de otra se puede entrar acá); fuera (alta de tienda, login de
 * plataforma) cualquier sesión manda a su destino de siempre. Recién dada de alta
 * (aviso de bienvenida pendiente) la dueña va a Apariencia (spec 1b §E.4): el login
 * del alta re-renderiza esta ruta antes que el navigate del asistente.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { slug } = useTienda()
  const enTienda = useSesionEnTienda()
  const sesion = slug ? enTienda : user
  if (!sesion) return children
  const recienCreada = sesion.role === "ADMIN" && leerBienvenida() !== null
  return <Navigate to={recienCreada ? "/admin/apariencia" : destinoTrasLogin(sesion)} replace />
}
