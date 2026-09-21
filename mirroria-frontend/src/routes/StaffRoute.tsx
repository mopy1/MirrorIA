import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

/**
 * Exige sesion + un rol de staff con acceso a reportes. Distinto de AdminRoute,
 * que pide ADMIN exacto: el backend habilita CU24 tambien al ENCARGADO_SUCURSAL
 * (acotado a su propia sucursal, forzado del lado del servidor).
 */
export function StaffRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== "ADMIN" && user?.role !== "ENCARGADO_SUCURSAL") {
    return <Navigate to="/" replace />
  }
  return children
}
