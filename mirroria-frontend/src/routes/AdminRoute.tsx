import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { destinoTrasLogin } from "@/lib/destino-sesion"

/**
 * Exige sesión de una tienda + role ADMIN. Es solo UX: el control real lo hace
 * el backend (JwtAuthGuard + RolesGuard + tenant del JWT). El rol se refresca
 * con /seguridad/auth/me al cargar la app (AuthContext).
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/entrar" replace />
  if (!user.tenant || user.role !== "ADMIN") return <Navigate to={destinoTrasLogin(user)} replace />
  return children
}
