import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

/**
 * Exige sesión + role ADMIN. Es solo UX (no mostrar el panel a quien no
 * corresponde): el control real lo hace el backend, cuyos endpoints de
 * gestión exigen JwtAuthGuard + RolesGuard + @Roles(...). El rol se refresca
 * con /seguridad/auth/me al cargar la app (AuthContext).
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />
  return children
}
