import { useEffect, useState } from "react"
import { Money, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { CobrosTable } from "@/features/admin/components/cobros-table"
import { paymentsApi } from "@/features/payments/api/paymentsApi"
import type { Pago } from "@/features/payments/types/payments.types"
import { ApiError } from "@/lib/api"

export function CobrosAdminPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setIsLoading(true)
    setError(null)
    try {
      setPagos(await paymentsApi.pendientes())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cargar la lista")
    } finally {
      setIsLoading(false)
    }
  }

  async function confirmar(pagoId: string) {
    setConfirmandoId(pagoId)
    setConfirmError(null)
    try {
      await paymentsApi.confirmar(pagoId)
      setPagos((actual) => actual.filter((p) => p.id !== pagoId))
    } catch (e) {
      setConfirmError(e instanceof ApiError ? e.message : "No se pudo confirmar el cobro")
    } finally {
      setConfirmandoId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
          <Money className="size-7 text-primary" />
          Cobros pendientes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirmá los cobros por QR o efectivo declarados por caja: pagos que la clienta ya
          hizo y esperan la validación del cajero.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {confirmError && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertDescription>{confirmError}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <CobrosTable pagos={pagos} confirmandoId={confirmandoId} onConfirmar={confirmar} />
      )}
    </div>
  )
}
