import { Backspace } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { cn } from "cn"
import { formatMoney } from "@/lib/money"

const LARGO_PIN = 4
const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "borrar"] as const

interface TecladoPinProps {
  montoCents: number
  comercio: string
  procesando: boolean
  onCompleto: (pin: string) => void
  onCancelar: () => void
}

/** El PIN de 4 dígitos, como en la app de un banco. En esta demo vale cualquiera. */
export function TecladoPin({ montoCents, comercio, procesando, onCompleto, onCancelar }: TecladoPinProps) {
  const [pin, setPin] = useState("")

  useEffect(() => {
    if (pin.length === LARGO_PIN) onCompleto(pin)
    // onCompleto cambia en cada render del padre; el disparo es por el PIN.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  // Teclado físico también, para quien prueba desde la laptop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (procesando) return
      if (/^\d$/.test(e.key)) setPin((p) => (p.length < LARGO_PIN ? p + e.key : p))
      if (e.key === "Backspace") setPin((p) => p.slice(0, -1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [procesando])

  function tocar(tecla: (typeof TECLAS)[number]) {
    if (procesando) return
    if (tecla === "borrar") setPin((p) => p.slice(0, -1))
    else if (tecla) setPin((p) => (p.length < LARGO_PIN ? p + tecla : p))
  }

  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <p className="text-sm text-[#16306B]/65">
        Vas a pagar {formatMoney(montoCents)} a {comercio}
      </p>
      <h1 className="mt-2 text-xl font-semibold">{procesando ? "Procesando el pago…" : "Ingresá tu PIN"}</h1>

      <div className="mt-6 flex gap-4" aria-label={`${pin.length} de ${LARGO_PIN} dígitos`}>
        {Array.from({ length: LARGO_PIN }, (_, i) => (
          <span
            key={i}
            className={cn(
              "size-3.5 rounded-full border-2 border-[#2453C9] transition-colors",
              i < pin.length && "bg-[#2453C9]",
              procesando && "motion-safe:animate-pulse"
            )}
          />
        ))}
      </div>

      <div className="mt-auto grid w-full grid-cols-3 gap-2 pt-10">
        {TECLAS.map((tecla, i) =>
          tecla === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={procesando}
              onClick={() => tocar(tecla)}
              aria-label={tecla === "borrar" ? "Borrar" : tecla}
              className="flex h-15 items-center justify-center rounded-xl text-2xl font-medium tabular-nums transition-colors hover:bg-[#DCE7FF]/60 active:bg-[#DCE7FF] focus-visible:outline-3 focus-visible:outline-[#2453C9]/40 disabled:opacity-40"
            >
              {tecla === "borrar" ? <Backspace className="size-6" /> : tecla}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={onCancelar}
        disabled={procesando}
        className="mt-4 text-sm font-medium text-[#2453C9] disabled:opacity-40"
      >
        Cancelar
      </button>
    </div>
  )
}
