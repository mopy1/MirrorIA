import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { BranchPicker } from "@/features/branches/components/branch-picker"
import { useCartLineItems } from "@/features/cart/hooks/useCartLineItems"
import { useValidarCupon } from "@/features/promotions/hooks/useValidarCupon"
import { CuponInput } from "../components/cupon-input"
import { OrderSummary } from "../components/order-summary"
import { useCheckout } from "../hooks/useCheckout"

export function CheckoutPage() {
  const { lineItems, isLoading: cartLoading, error: cartError } = useCartLineItems()
  const { sucursalId, setSucursalId, confirmar, isLoading, error } = useCheckout()
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
    confirmar(cuponAplicado?.codigo)
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

      <p className="text-xs text-muted-foreground">
        El cobro digital todavía se coordina manualmente — la pasarela de pago está en
        construcción. Tu pedido queda registrado como pendiente de pago.
      </p>

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
