import { useEffect, useMemo, useState, type ReactNode } from "react"
import { authApi } from "@/features/auth/api/authApi"
import type { UsuarioResponse } from "@/features/auth/types/auth.types"
import { ApiError, TOKEN_KEY, USER_KEY } from "@/lib/api"
import { outboxManager } from "@/lib/offline/outbox-manager"
import { AuthContext, type AuthContextValue } from "./auth-context"

function readStoredUser(): UsuarioResponse | null {
  const raw = localStorage.getItem(USER_KEY)
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
    if (!localStorage.getItem(TOKEN_KEY)) return
    authApi
      .getMe()
      .then((fresco) => {
        localStorage.setItem(USER_KEY, JSON.stringify(fresco))
        setUser(fresco)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
          setUser(null)
        }
      })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login: (auth) => {
        localStorage.setItem(TOKEN_KEY, auth.accessToken)
        localStorage.setItem(USER_KEY, JSON.stringify(auth.usuario))
        setUser(auth.usuario)
        // Si la cola estaba en pausa por un 401, la sesión nueva la reanuda (mismas claves).
        void outboxManager.procesarCola()
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      },
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
