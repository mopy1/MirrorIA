import { useState } from "react"
import { CircleNotch } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SelectorMetodoPago } from "@/features/checkout/components/selector-metodo-pago"
import type { MetodoPago } from "../types/payments.types"

interface ElegirPagoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  descripcion: string
  textoConfirmar: string
  metodoInicial?: MetodoPago
  isLoading?: boolean
  error?: string | null
  onConfirmar: (metodo: MetodoPago) => void
}

/** Elegir cómo pagar una venta (reserva comprada o compra confirmada tras sincronizar). */
export function ElegirPagoDialog(props: ElegirPagoDialogProps) {
  const [metodo, setMetodo] = useState<MetodoPago>(props.metodoInicial ?? "EFECTIVO")
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-md space-y-4 p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="font-heading text-base">{props.titulo}</DialogTitle>
          <DialogDescription className="text-sm">{props.descripcion}</DialogDescription>
        </DialogHeader>
        <SelectorMetodoPago metodo={metodo} onChange={setMetodo} />
        {props.error && (
          <Alert variant="destructive">
            <AlertDescription>{props.error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={props.isLoading}>
            Ahora no
          </Button>
          <Button onClick={() => props.onConfirmar(metodo)} disabled={props.isLoading}>
            {props.isLoading && <CircleNotch className="size-4 animate-spin" />}
            {props.textoConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
