import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { destinoTrasLogin } from "@/lib/destino-sesion"
import { authApi } from "../api/authApi"
import type { LoginRequest } from "../types/auth.types"

/** `plataforma`: login sin tienda (busca la cuenta de DUENO_PLATAFORMA). */
export function useLogin(plataforma = false) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(data: LoginRequest) {
    setIsLoading(true)
    setError(null)
    try {
      const auth = await authApi.login(data, plataforma)
      login(auth)
      navigate(destinoTrasLogin(auth.usuario))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return { submit, isLoading, error }
}
