import { useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { precargarFuente } from "@/lib/tema/fuentes"
import { FUENTES, RADIOS } from "@/lib/tema/marca.constants"
import type { FuenteMarca, RadioMarca } from "@/types/marca.types"
import { cn } from "cn"
import { CandadoPlan } from "./candado-plan"
import type { SeccionProps } from "./seccion-props"

const opcion = (activa: boolean) =>
  cn("rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50", activa ? "border-primary ring-1 ring-primary/40" : "border-border hover:border-foreground/30")

/** Modo, forma de bordes y fuente de títulos (desde el plan Crecimiento). */
export function SeccionEstilo({ editor, mi }: SeccionProps) {
  const { vista: v, actualizar } = editor
  const bloqueado = !mi.permitido.estilo
  // Las tarjetas "Aa" se dibujan en su propia fuente: se piden las 4 al abrir la pestaña.
  useEffect(() => (Object.keys(FUENTES) as FuenteMarca[]).forEach(precargarFuente), [])
  return (
    <CandadoPlan titulo="Estilo" nivel="COMPLETA" bloqueado={bloqueado}>
      <div className="space-y-5">
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <span>
            <span className="block text-sm font-medium">Modo oscuro</span>
            <span className="block text-xs text-muted-foreground">Fondo casi negro y textos claros en toda la tienda.</span>
          </span>
          <Switch checked={v.modo === "OSCURO"} onCheckedChange={(on) => actualizar((b) => ({ ...b, modo: on ? "OSCURO" : "CLARO" }))} />
        </label>
        <p id="estilo-bordes" className="-mb-3 text-sm font-medium">Forma de los bordes</p>
        <div role="radiogroup" aria-labelledby="estilo-bordes" className="grid grid-cols-3 gap-2">
          {(Object.keys(RADIOS) as RadioMarca[]).map((r) => (
            <button key={r} type="button" role="radio" aria-checked={v.radio === r} className={opcion(v.radio === r)} onClick={() => actualizar((b) => ({ ...b, radio: r }))}>
              <span className="block h-7 w-full border-2 border-foreground/70 border-r-0 border-b-0" style={{ borderTopLeftRadius: RADIOS[r].valor }} aria-hidden />
              <span className="mt-2 block text-xs font-medium">{RADIOS[r].nombre}</span>
            </button>
          ))}
        </div>
        <p id="estilo-fuente" className="-mb-3 text-sm font-medium">Fuente de títulos</p>
        <div role="radiogroup" aria-labelledby="estilo-fuente" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(FUENTES) as FuenteMarca[]).map((f) => (
            <button key={f} type="button" role="radio" aria-checked={v.fuente === f} className={opcion(v.fuente === f)} onClick={() => actualizar((b) => ({ ...b, fuente: f }))}>
              <span className="block text-3xl leading-none font-semibold" style={{ fontFamily: FUENTES[f].pila }}>Aa</span>
              <span className="mt-2 block text-xs font-medium">{FUENTES[f].nombre}</span>
            </button>
          ))}
        </div>
      </div>
    </CandadoPlan>
  )
}
