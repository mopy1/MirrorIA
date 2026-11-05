import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"

/** Dentro de `/t/:slug`: exige una sesión DE ESTA tienda (otra tienda no sirve). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useSesionEnTienda()
  const ruta = useRutaTienda()
  if (!user) return <Navigate to={ruta("/login")} replace />
  return children
}
