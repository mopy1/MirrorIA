import { useEffect, useMemo, useState, type ReactNode } from "react"
import { authApi } from "@/features/auth/api/authApi"
import type { UsuarioResponse } from "@/features/auth/types/auth.types"
import { ApiError } from "@/lib/api"
import { AuthContext, type AuthContextValue } from "./auth-context"

function readStoredUser(): UsuarioResponse | null {
  const raw = localStorage.getItem("mirroria_user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as UsuarioResponse
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioResponse | null>(readStoredUser)

  // El usuario guardado puede tener un rol viejo (el ADMIN lo cambió): al
  // cargar la app se refresca con /me. Un 401 ahí (cuenta desactivada o token
  // vencido) cierra la sesión; un error de red deja la guardada.
  useEffect(() => {
    if (!localStorage.getItem("mirroria_token")) return
    authApi
      .getMe()
      .then((fresco) => {
        localStorage.setItem("mirroria_user", JSON.stringify(fresco))
        setUser(fresco)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem("mirroria_token")
          localStorage.removeItem("mirroria_user")
          setUser(null)
        }
      })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login: (auth) => {
        localStorage.setItem("mirroria_token", auth.accessToken)
        localStorage.setItem("mirroria_user", JSON.stringify(auth.usuario))
        setUser(auth.usuario)
      },
      logout: () => {
        localStorage.removeItem("mirroria_token")
        localStorage.removeItem("mirroria_user")
        setUser(null)
      },
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
