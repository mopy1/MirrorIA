import { CreditCard, Money } from "@phosphor-icons/react"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BranchPicker } from "@/features/branches/components/branch-picker"
import { useCartLineItems } from "@/features/cart/hooks/useCartLineItems"
import type { MetodoPago } from "@/features/payments/types/payments.types"
import { useValidarCupon } from "@/features/promotions/hooks/useValidarCupon"
import { CuponInput } from "../components/cupon-input"
import { OrderSummary } from "../components/order-summary"
import { useCheckout } from "../hooks/useCheckout"

const METODOS: { value: MetodoPago; label: string; icon: typeof CreditCard }[] = [
  { value: "TARJETA", label: "Tarjeta", icon: CreditCard },
  { value: "EFECTIVO", label: "Efectivo", icon: Money },
]

export function CheckoutPage() {
  const { lineItems, isLoading: cartLoading, error: cartError } = useCartLineItems()
  const { sucursalId, setSucursalId, confirmar, isLoading, error } = useCheckout()
  const [metodo, setMetodo] = useState<MetodoPago>("TARJETA")
  const {
    codigo,
    setCodigo,
    cuponAplicado,
    descuentoCents,
    isLoading: cuponLoading,
    error: cuponError,
    mensajeExito,
    aplicar,
    remover,
  } = useValidarCupon()

  const subtotalCents = lineItems.reduce((sum, item) => sum + item.subtotalCents, 0)

  function handleConfirmar() {
    confirmar(metodo, cuponAplicado?.codigo)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-14 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Confirmar compra</h1>

      {cartError && (
        <Alert variant="destructive">
          <AlertDescription>{cartError}</AlertDescription>
        </Alert>
      )}

      {!cartLoading && (
        <OrderSummary
          items={lineItems}
          descuentoCents={descuentoCents}
          codigoCupon={cuponAplicado?.codigo}
        />
      )}

      {!cartLoading && lineItems.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <CuponInput
            codigo={codigo}
            onCodigoChange={setCodigo}
            onAplicar={() => aplicar(subtotalCents)}
            onRemover={remover}
            cuponAplicado={cuponAplicado}
            descuentoCents={descuentoCents}
            isLoading={cuponLoading}
            error={cuponError}
            mensajeExito={mensajeExito}
          />
        </div>
      )}

      <div>
        <BranchPicker value={sucursalId} onChange={setSucursalId} label="Retirar / entregar en" />
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-2.5">
        <Label>Método de pago</Label>
        <div className="grid grid-cols-2 gap-2">
          {METODOS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              variant={metodo === value ? "default" : "outline"}
              className="h-auto flex-col gap-1.5 py-3"
              aria-pressed={metodo === value}
              onClick={() => setMetodo(value)}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {metodo === "TARJETA"
            ? "Se paga en línea. Si la pasarela no está disponible, te ofrecemos pagar en efectivo."
            : "Al confirmar vas a ver las instrucciones para completar el pago."}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!sucursalId || lineItems.length === 0 || isLoading}
        onClick={handleConfirmar}
      >
        {isLoading ? "Procesando pedido..." : "Confirmar pedido"}
      </Button>
    </div>
  )
}
