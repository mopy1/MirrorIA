import { useEffect } from "react"
import { SelectorPaleta } from "@/components/marca/selector-paleta"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { precargarFuente } from "@/lib/tema/fuentes"
import { FUENTES, RADIOS } from "@/lib/tema/marca.constants"
import type { FuenteMarca, RadioMarca } from "@/types/marca.types"
import type { useDemoMarca } from "../../hooks/useDemoMarca"

type Demo = ReturnType<typeof useDemoMarca>

/** Panel de la demo: paleta, fuente de títulos, forma y modo oscuro. */
export function DemoControles({ d }: { d: Demo }) {
  useEffect(() => (Object.keys(FUENTES) as FuenteMarca[]).forEach(precargarFuente), [])
  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <p className="text-sm font-medium">Colores</p>
        <SelectorPaleta valor={d.paleta} onCambiar={d.setPaleta} />
      </div>
      <div className="space-y-2.5">
        <p className="text-sm font-medium">Fuente de títulos</p>
        <ToggleGroup variant="outline" value={[d.fuente]} onValueChange={(v) => v[0] && d.setFuente(v[0] as FuenteMarca)} className="flex-wrap" aria-label="Fuente de títulos">
          {(Object.keys(FUENTES) as FuenteMarca[]).map((f) => (
            <ToggleGroupItem key={f} value={f} style={{ fontFamily: FUENTES[f].pila }}>{FUENTES[f].nombre}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="space-y-2.5">
        <p className="text-sm font-medium">Bordes</p>
        <ToggleGroup variant="outline" value={[d.radio]} onValueChange={(v) => v[0] && d.setRadio(v[0] as RadioMarca)} aria-label="Forma de los bordes">
          {(Object.keys(RADIOS) as RadioMarca[]).map((r) => <ToggleGroupItem key={r} value={r}>{RADIOS[r].nombre}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>
      <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
        <span className="text-sm font-medium">Modo oscuro</span>
        <Switch checked={d.modo === "OSCURO"} onCheckedChange={(on) => d.setModo(on ? "OSCURO" : "CLARO")} />
      </label>
    </div>
  )
}
