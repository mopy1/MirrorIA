import { CheckCircle, Clock, QrCode } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { formatMoney } from "@/lib/money"
import type { CobroWayra } from "../types/wayra.types"

const fechaHora = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" })

/** Lo que muestra el banco cuando el QR escaneado ya no se puede pagar. */
export function AvisoCobro({ cobro }: { cobro: CobroWayra | null }) {
  if (!cobro) {
    return (
      <Centro icono={<QrCode className="size-10" />} titulo="Este QR no es válido">
        No encontramos un cobro para este código. Pedile al comercio que genere uno nuevo.
      </Centro>
    )
  }
  if (cobro.estado === "PAGADO") {
    return (
      <Centro icono={<CheckCircle weight="fill" className="size-10" />} titulo="Este QR ya fue pagado">
        {formatMoney(cobro.montoCents)} a {cobro.comercio}
        {cobro.transaccion && <><br />Transacción {cobro.transaccion}</>}
        {cobro.pagadoEn && <><br />{fechaHora.format(new Date(cobro.pagadoEn))}</>}
      </Centro>
    )
  }
  return (
    <Centro icono={<Clock className="size-10" />} titulo="Este QR venció">
      La compra de {cobro.comercio} ya no acepta pagos. No se debitó nada de tu cuenta.
    </Centro>
  )
}

function Centro({ icono, titulo, children }: { icono: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
      <span className="flex size-18 items-center justify-center rounded-full bg-[#DCE7FF] text-[#2453C9]">
        {icono}
      </span>
      <h1 className="mt-5 text-xl font-semibold">{titulo}</h1>
      <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-[#16306B]/65">{children}</p>
    </div>
  )
}
