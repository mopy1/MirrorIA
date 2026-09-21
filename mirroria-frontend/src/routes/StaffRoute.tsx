import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import type { UsuarioRole } from "@/features/auth/types/auth.types"

/** Roles de reportes (CU24): ADMIN + ENCARGADO_SUCURSAL, acotado a su propia sucursal del lado del servidor. */
export const REPORTES_ROLES: UsuarioRole[] = ["ADMIN", "ENCARGADO_SUCURSAL"]

/**
 * Exige sesion + uno de los roles permitidos. Los roles son parametrizables
 * por ruta: cada pantalla de staff habilita un par distinto del lado del
 * backend (p. ej. reportes es ADMIN+ENCARGADO_SUCURSAL, confirmar cobros es
 * ADMIN+CAJERO). Si no se pasa `allowedRoles`, se mantiene el comportamiento
 * historico de esta ruta (reportes). Distinto de AdminRoute, que pide ADMIN
 * exacto siempre.
 */
export function StaffRoute({
  children,
  allowedRoles = REPORTES_ROLES,
}: {
  children: ReactNode
  allowedRoles?: UsuarioRole[]
}) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.role || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}
