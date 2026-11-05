import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { guardarBienvenida } from "@/lib/bienvenida"
import { saasApi } from "../api/saasApi"
import type { RegistrarTiendaDto } from "../types/saas.types"

/** `POST /saas/tiendas` → entra logueada como ADMIN a `/admin/apariencia` con el aviso de bienvenida (spec 1b §E.4). */
export function useRegistrarTienda() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function registrar(dto: RegistrarTiendaDto) {
    setIsLoading(true)
    setError(null)
    try {
      const res = await saasApi.registrarTienda(dto)
      guardarBienvenida(res.suscripcion.diasRestantes)
      // Mismo tick: React agrupa ambos cambios y GuestRoute no alcanza a mandar a /admin/catalogo.
      navigate("/admin/apariencia", { replace: true })
      login(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la tienda")
    } finally {
      setIsLoading(false)
    }
  }

  return { registrar, isLoading, error }
}
