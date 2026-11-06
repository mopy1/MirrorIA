import { ArrowDownRight, ArrowUpRight } from "@phosphor-icons/react"
import { cn } from "cn"
import type { Cifra } from "../../lib/lienzo-cifras"

const TONO = {
  sube: { clase: "text-emerald-700 dark:text-emerald-400", Icono: ArrowUpRight },
  baja: { clase: "text-destructive", Icono: ArrowDownRight },
} as const

/** Cifras clave: nombre humano, valor y una frase que lo pone en contexto. Sin cajas: grilla con aire. */
export function CifrasClave({ cifras }: { cifras: Cifra[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-5 @md:grid-cols-2 @2xl:grid-cols-4">
      {cifras.map((c) => {
        const tono = c.tendencia && c.tendencia !== "igual" ? TONO[c.tendencia] : null
        return (
          <div key={c.id} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{c.etiqueta}</dt>
            <dd
              className={cn(
                "mt-1 font-semibold text-foreground break-words",
                c.esTexto ? "text-base leading-snug" : "text-2xl leading-tight tabular-nums",
              )}
            >
              {c.valor}
            </dd>
            {c.detalle && (
              <dd className={cn("mt-1 flex items-start gap-1 text-xs tabular-nums", tono ? tono.clase : "text-muted-foreground")}>
                {tono && <tono.Icono className="mt-px size-3.5 shrink-0" aria-hidden />}
                <span>{c.detalle}</span>
              </dd>
            )}
          </div>
        )
      })}
    </dl>
  )
}
