import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { authApi } from "../api/authApi"
import type { LoginRequest } from "../types/auth.types"

export function useLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(data: LoginRequest) {
    setIsLoading(true)
    setError(null)
    try {
      const auth = await authApi.login(data)
      login(auth)
      navigate("/")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return { submit, isLoading, error }
}
