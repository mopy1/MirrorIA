import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import type { Instrucciones } from "../types/payments.types"

interface DetallePagoCardProps {
  instrucciones: Instrucciones
  esQr: boolean
}

/** Tarjeta con el QR (si es ese el método), monto y referencia — extraída de
 * `instrucciones-pago.tsx` (Regla 1.B: < 150 líneas por archivo). */
export function DetallePagoCard({ instrucciones, esQr }: DetallePagoCardProps) {
  return (
    <Card className="mt-6 w-full">
      <CardContent className="flex flex-col items-center gap-4">
        {esQr &&
          (instrucciones.qrUrl ? (
            <img
              src={instrucciones.qrUrl}
              alt="Código QR para pagar"
              className="size-56 rounded-xl border border-border/80 object-contain"
            />
          ) : (
            <Alert>
              <AlertDescription>
                Todavía no tenemos la imagen del QR configurada. Mostrale tu referencia al
                equipo para que te la facilite.
              </AlertDescription>
            </Alert>
          ))}

        <div>
          <p className="text-sm text-muted-foreground">Monto a pagar</p>
          <p className="text-2xl font-semibold">{formatMoney(instrucciones.montoCents)}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Referencia</p>
          <Badge variant="outline" className="mt-1 font-mono text-sm">
            {instrucciones.referencia}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
