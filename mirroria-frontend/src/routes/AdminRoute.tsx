import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

/**
 * Exige sesión + role ADMIN. Nota: los endpoints del backend que este panel
 * consume todavía NO están protegidos por rol (ver TODOs en
 * mirroria-backend, ej. categorias.controller.ts) — este gate es hoy una
 * cortina de UX en el frontend, no un control de seguridad real todavía.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />
  return children
}
