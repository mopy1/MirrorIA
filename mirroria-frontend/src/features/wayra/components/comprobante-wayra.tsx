import { Check } from "@phosphor-icons/react"
import { formatMoney } from "@/lib/money"
import type { ComprobanteWayra } from "../types/wayra.types"

const fechaHora = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" })

/** El comprobante que deja el banco al terminar. El sello dorado es el único adorno. */
export function ComprobanteWayraVista({ comprobante }: { comprobante: ComprobanteWayra }) {
  const filas: [string, string][] = [
    ["Pagado a", comprobante.comercio],
    ["Concepto", comprobante.glosa],
    ["Desde", comprobante.cuentaOrigen],
    ["Titular", comprobante.titular],
    ["N.º de transacción", comprobante.transaccion],
    ["Fecha y hora", fechaHora.format(new Date(comprobante.pagadoEn))],
  ]

  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#F2B33D] text-[#16306B] shadow-[0_0_0_6px_#F2B33D33] motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-500">
        <Check weight="bold" className="size-8" />
      </span>
      <h1 className="mt-4 text-xl font-semibold">Pago realizado</h1>
      <p className="mt-3 text-[2.5rem] leading-none font-semibold tracking-tight tabular-nums">
        {formatMoney(comprobante.montoCents)}
      </p>

      <dl className="mt-7 w-full rounded-xl border border-[#16306B]/10 bg-white text-left text-sm">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex justify-between gap-4 border-b border-[#16306B]/8 px-4 py-3 last:border-b-0">
            <dt className="text-[#16306B]/60">{etiqueta}</dt>
            <dd className="text-right font-medium tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-[#16306B]/55">El comercio ya recibió la confirmación de tu pago.</p>
    </div>
  )
}
