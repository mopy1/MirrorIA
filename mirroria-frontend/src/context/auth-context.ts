import { createContext } from "react"
import type { AuthResponse, UsuarioResponse } from "@/features/auth/types/auth.types"

export interface AuthContextValue {
  user: UsuarioResponse | null
  isAuthenticated: boolean
  login: (auth: AuthResponse) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
