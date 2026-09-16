import { useMemo, useState, type ReactNode } from "react"
import type { UsuarioResponse } from "@/features/auth/types/auth.types"
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
