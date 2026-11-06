import { formatearValor } from "../lib/report-value.utils"

type ItemTooltip = { color?: string; payload?: { fill?: string } }

/** Fila del tooltip de Recharts: nombre humano de la serie + valor con formato (Bs si es dinero). */
export function formatterTooltip(metrica: string, nombres: Record<string, string>) {
  return (value: unknown, name: unknown, item: ItemTooltip) => (
    <div className="flex w-full items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color ?? item.payload?.fill }} aria-hidden />
      <div className="flex flex-1 justify-between gap-4">
        <span className="text-muted-foreground">{nombres[String(name)] ?? String(name)}</span>
        <span className="font-medium tabular-nums text-foreground">{formatearValor(Number(value), metrica)}</span>
      </div>
    </div>
  )
}
