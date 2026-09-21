import { useEffect, useState } from "react"
import { CheckCircle, Money, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { paymentsApi } from "@/features/payments/api/paymentsApi"
import type { MetodoPago, Pago } from "@/features/payments/types/payments.types"
import { ApiError } from "@/lib/api"
import { formatMoney } from "@/lib/money"

const METODO_LABEL: Record<MetodoPago, string> = {
  TARJETA: "Tarjeta",
  QR: "QR",
  EFECTIVO: "Efectivo",
}

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
        <Card className="overflow-hidden p-0 border bg-card shadow-xs">
          <CardContent className="p-0">
            <Table className="min-w-[620px]">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[20%] font-medium">Monto</TableHead>
                  <TableHead className="w-[16%] font-medium">Método</TableHead>
                  <TableHead className="w-[32%] font-medium">Referencia</TableHead>
                  <TableHead className="w-[16%] font-medium">Fecha</TableHead>
                  <TableHead className="w-[16%] text-right font-medium">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                      No hay cobros esperando confirmación
                    </TableCell>
                  </TableRow>
                ) : (
                  pagos.map((pago) => (
                    <TableRow key={pago.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-sm text-foreground">
                        {formatMoney(pago.montoCents)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {METODO_LABEL[pago.metodo] ?? pago.metodo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs font-normal">
                          #{pago.ventaId.slice(0, 8).toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(pago.createdAt).toLocaleDateString("es-BO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled={confirmandoId === pago.id}
                          onClick={() => confirmar(pago.id)}
                        >
                          <CheckCircle className="size-3.5" data-icon="inline-start" />
                          <span>
                            {confirmandoId === pago.id ? "Confirmando…" : "Confirmar cobro"}
                          </span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
