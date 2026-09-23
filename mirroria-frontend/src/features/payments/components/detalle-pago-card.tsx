import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import type { Instrucciones } from "../types/payments.types"

interface DetallePagoCardProps {
  instrucciones: Instrucciones
}

/** Tarjeta con el monto y la referencia a mostrarle al cajero — extraída de
 * `instrucciones-pago.tsx` (Regla 1.B: < 150 líneas por archivo). */
export function DetallePagoCard({ instrucciones }: DetallePagoCardProps) {
  return (
    <Card className="mt-6 w-full">
      <CardContent className="flex flex-col items-center gap-4">
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
