import { CheckCircle } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MetodoPago, Pago } from "@/features/payments/types/payments.types"
import { formatMoney } from "@/lib/money"

const METODO_LABEL: Record<MetodoPago, string> = {
  TARJETA: "Tarjeta",
  EFECTIVO: "Efectivo",
}

interface CobrosTableProps {
  pagos: Pago[]
  confirmandoId: string | null
  onConfirmar: (pagoId: string) => void
}

export function CobrosTable({ pagos, confirmandoId, onConfirmar }: CobrosTableProps) {
  return (
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
                      onClick={() => onConfirmar(pago.id)}
                    >
                      <CheckCircle className="size-3.5" data-icon="inline-start" />
                      <span>{confirmandoId === pago.id ? "Confirmando…" : "Confirmar cobro"}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
