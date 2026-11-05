import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type Moneda = "BOB" | "USD"

export function MonedaToggle({ valor, onCambiar }: { valor: Moneda; onCambiar: (m: Moneda) => void }) {
  return (
    <ToggleGroup variant="outline" size="sm" value={[valor]} onValueChange={(v) => v[0] && onCambiar(v[0] as Moneda)} aria-label="Moneda de los precios">
      <ToggleGroupItem value="BOB" className="px-3">Bs</ToggleGroupItem>
      <ToggleGroupItem value="USD" className="px-3">USD</ToggleGroupItem>
    </ToggleGroup>
  )
}
