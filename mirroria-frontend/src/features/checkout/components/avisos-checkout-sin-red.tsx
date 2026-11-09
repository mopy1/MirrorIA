import { AvisoSinRed } from "@/components/common/aviso-sin-red"

/** Avisos del checkout sin red: se puede confirmar (queda en cola) pero no pagar (RN08). */
export function AvisosCheckoutSinRed({ online, checkoutEnCola }: { online: boolean; checkoutEnCola: boolean }) {
  return (
    <>
      {!online && (
        <AvisoSinRed>
          Estás sin conexión. Podés confirmar igual: el pedido queda <strong>pendiente de confirmar</strong> en este
          dispositivo y se envía solo al volver la red. El pago se hace después, con conexión.
        </AvisoSinRed>
      )}
      {checkoutEnCola && (
        <AvisoSinRed>Ya tenés una compra esperando la conexión. Cuando se confirme vas a poder hacer otra.</AvisoSinRed>
      )}
    </>
  )
}
