import { CheckCircle } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { formatMoney } from "@/lib/money"
import type { CobroQr } from "../types/payments.types"

const fechaHora = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" })

interface QrPagadoProps {
  cobro: CobroQr
  transaccion: string | null
  pagadoEn: string | null
}

/** Lo que aparece en la tienda en el instante en que el banco avisa el pago. */
export function QrPagado({ cobro, transaccion, pagadoEn }: QrPagadoProps) {
  const filas: [string, string][] = [
    ["Comercio", cobro.comercio],
    ["Referencia", cobro.referencia],
    ...(transaccion ? ([["N.º de transacción", transaccion]] as [string, string][]) : []),
    ...(pagadoEn ? ([["Fecha y hora", fechaHora.format(new Date(pagadoEn))]] as [string, string][]) : []),
  ]

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:px-6">
      <CheckCircle
        weight="fill"
        className="size-16 text-primary motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500"
      />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Pago recibido</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        El banco confirmó tu pago. Tu compra ya está pagada y lista para retirar.
      </p>
      <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">
        {formatMoney(cobro.montoCents)}
      </p>

      <dl className="mt-6 w-full divide-y divide-border/70 rounded-2xl border border-border/80 bg-card text-sm">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex justify-between gap-4 px-5 py-3">
            <dt className="text-muted-foreground">{etiqueta}</dt>
            <dd className="text-right font-medium tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>

      <Link to="/tienda" className={cn(buttonVariants(), "mt-8 w-full")}>
        Seguir comprando
      </Link>
    </div>
  )
}
