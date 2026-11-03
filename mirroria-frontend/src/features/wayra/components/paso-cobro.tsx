import { cn } from "cn"
import { formatMoney } from "@/lib/money"
import type { CobroWayra } from "../types/wayra.types"

interface PasoCobroProps {
  cobro: CobroWayra
  cuentaId: string | null
  onCuenta: (id: string) => void
  error: string | null
}

/** Primer paso al escanear: a quién se le paga, cuánto, y desde qué cuenta. */
export function PasoCobro({ cobro, cuentaId, onCuenta, error }: PasoCobroProps) {
  return (
    <>
      <p className="text-sm text-[#16306B]/65">Pago con QR a</p>
      <p className="mt-0.5 text-xl font-semibold">{cobro.comercio}</p>
      <p className="text-sm text-[#16306B]/65">{cobro.glosa}</p>

      <p className="mt-7 text-sm text-[#16306B]/65">Monto</p>
      <p className="text-[2.75rem] leading-none font-semibold tracking-tight tabular-nums">
        {formatMoney(cobro.montoCents)}
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B1C1C]">
          {error}
        </p>
      )}

      <fieldset className="mt-8">
        <legend className="text-sm font-medium">Pagar desde</legend>
        <div className="mt-2.5 space-y-2.5">
          {cobro.cuentas.map((cuenta) => {
            const elegida = cuenta.id === cuentaId
            const alcanza = cuenta.saldoCents >= cobro.montoCents
            return (
              <label
                key={cuenta.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3.5 transition-colors",
                  "has-focus-visible:outline-3 has-focus-visible:outline-[#2453C9]/40",
                  elegida ? "border-[#2453C9] bg-[#DCE7FF]/40" : "border-[#16306B]/12"
                )}
              >
                <input
                  type="radio"
                  name="cuenta"
                  value={cuenta.id}
                  checked={elegida}
                  onChange={() => onCuenta(cuenta.id)}
                  className="size-4 accent-[#2453C9]"
                />
                <span className="flex-1">
                  <span className="block font-medium">{cuenta.tipo}</span>
                  <span className="block text-sm text-[#16306B]/60 tabular-nums">
                    {cuenta.numeroEnmascarado}
                  </span>
                </span>
                <span className="text-right text-sm tabular-nums">
                  <span className="block text-[#16306B]/60">Disponible</span>
                  <span className={cn("block font-medium", !alcanza && "text-[#9B1C1C]")}>
                    {formatMoney(cuenta.saldoCents)}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </>
  )
}
