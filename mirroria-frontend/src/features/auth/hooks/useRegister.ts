import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { authApi } from "../api/authApi"
import type { RegisterRequest } from "../types/auth.types"

export function useRegister() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(data: RegisterRequest) {
    setIsLoading(true)
    setError(null)
    try {
      const auth = await authApi.register(data)
      login(auth)
      navigate("/")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  return { submit, isLoading, error }
}
