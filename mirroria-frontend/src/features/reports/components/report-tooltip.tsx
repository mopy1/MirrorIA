import { formatearValor } from "../lib/report-value.utils"

export function tooltipDinero(metrica: string) {
  return (value: unknown, name: unknown, item: { color?: string; payload?: { fill?: string } }) => (
    <div className="flex w-full items-center gap-2">
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
        style={{ backgroundColor: item.color ?? item.payload?.fill }}
      />
      <div className="flex flex-1 justify-between gap-4">
        <span className="text-muted-foreground">{String(name)}</span>
        <span className="font-mono font-medium tabular-nums text-foreground">
          {formatearValor(Number(value), metrica)}
        </span>
      </div>
    </div>
  )
}
