import { Navigate, useParams } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

/** Redirige `/t/:slug/admin` hacia `/admin` (si ya está logueado como staff de esa tienda) o a su `/login`. */
export function TiendaAdminRedirect() {
  const { slug } = useParams()
  const { user } = useAuth()

  if (user && user.tenant?.slug === slug && ["ADMIN", "ENCARGADO_SUCURSAL", "CAJERO"].includes(user.role)) {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to={`/t/${slug}/login`} replace />
}
