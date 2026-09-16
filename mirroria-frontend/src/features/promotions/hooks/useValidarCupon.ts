import { useState } from "react"
import { ApiError } from "@/lib/api"
import { promotionsApi } from "../api/promotionsApi"
import type { Cupon } from "../types/promotions.types"

export function useValidarCupon() {
  const [codigo, setCodigo] = useState("")
  const [cuponAplicado, setCuponAplicado] = useState<Cupon | null>(null)
  const [descuentoCents, setDescuentoCents] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  async function aplicar(subtotalCents: number) {
    if (!codigo.trim()) {
      setError("Ingresa un código de cupón")
      return
    }

    setIsLoading(true)
    setError(null)
    setMensajeExito(null)

    try {
      const res = await promotionsApi.validarCupon(codigo.trim(), subtotalCents)
      if (res.valido && res.cupon) {
        setCuponAplicado(res.cupon)
        setDescuentoCents(res.descuentoCents)
        setMensajeExito(res.mensaje || "Cupón aplicado correctamente")
      } else {
        setCuponAplicado(null)
        setDescuentoCents(0)
        setError(res.mensaje || "El cupón no es válido para esta compra")
      }
    } catch (err) {
      setCuponAplicado(null)
      setDescuentoCents(0)
      setError(err instanceof ApiError ? err.message : "Error al verificar el cupón")
    } finally {
      setIsLoading(false)
    }
  }

  function remover() {
    setCodigo("")
    setCuponAplicado(null)
    setDescuentoCents(0)
    setError(null)
    setMensajeExito(null)
  }

  return {
    codigo,
    setCodigo,
    cuponAplicado,
    descuentoCents,
    isLoading,
    error,
    mensajeExito,
    aplicar,
    remover,
  }
}
