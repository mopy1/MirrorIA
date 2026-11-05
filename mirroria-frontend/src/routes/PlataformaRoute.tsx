import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { destinoTrasLogin } from "@/lib/destino-sesion"

/** Exige `DUENO_PLATAFORMA` (UX; el backend lo vuelve a exigir con @Roles). */
export function PlataformaRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/plataforma/login" replace />
  if (user.role !== "DUENO_PLATAFORMA") return <Navigate to={destinoTrasLogin(user)} replace />
  return children
}
