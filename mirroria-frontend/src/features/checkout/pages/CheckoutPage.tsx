import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CircleNotch } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { useOutbox } from "@/lib/offline/use-outbox"
import { BranchPicker } from "@/features/branches/components/branch-picker"
import { useCartLineItems } from "@/features/cart/hooks/useCartLineItems"
import type { MetodoPago } from "@/features/payments/types/payments.types"
import { useValidarCupon } from "@/features/promotions/hooks/useValidarCupon"
import { AvisosCheckoutSinRed } from "../components/avisos-checkout-sin-red"
import { CompraEncolada } from "../components/compra-encolada"
import { CuponInput } from "../components/cupon-input"
import { OrderSummary } from "../components/order-summary"
import { SelectorMetodoPago } from "../components/selector-metodo-pago"
import { useCheckout } from "../hooks/useCheckout"

export function CheckoutPage() {
  const { lineItems, isLoading: cartLoading, error: cartError } = useCartLineItems()
  const { sucursalId, setSucursalId, confirmar, isLoading, error, encolada } = useCheckout()
  const { checkoutEnCola } = useCart()
  const { online } = useOutbox()
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
  const hayNoDisponibles = lineItems.some((i) => !i.disponible)

  function handleConfirmar() {
    const unidades = lineItems.reduce((n, i) => n + i.cantidad, 0)
    const nombres = lineItems.map((i) => `${i.productoTitulo} ${i.tallaNombre}`).join(", ")
    confirmar(metodo, cuponAplicado?.codigo, `${unidades} prenda${unidades === 1 ? "" : "s"}: ${nombres}`)
  }

  if (encolada) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-14 space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Confirmar compra</h1>
        <CompraEncolada operacion={encolada} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-14 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Confirmar compra</h1>

      <AvisosCheckoutSinRed online={online} checkoutEnCola={checkoutEnCola} />

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

      <SelectorMetodoPago metodo={metodo} onChange={setMetodo} />

      {hayNoDisponibles && (
        <Alert variant="destructive">
          <AlertDescription>
            Tu carrito tiene prendas que ya no están disponibles. Quitalas desde el carrito para continuar.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!sucursalId || lineItems.length === 0 || hayNoDisponibles || isLoading || checkoutEnCola}
        onClick={handleConfirmar}
      >
        {isLoading && <CircleNotch className="size-4 animate-spin" />}
        {isLoading ? "Procesando pedido..." : online ? "Confirmar pedido" : "Guardar pedido sin conexión"}
      </Button>
    </div>
  )
}
