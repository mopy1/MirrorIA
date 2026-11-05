import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { NIVELES, ORDEN_NIVEL } from "@/lib/tema/marca.constants"
import type { NivelMarca } from "@/types/marca.types"
import type { PlanForm } from "../lib/plan-form"

/** Nivel de personalización del plan (qué incluye cada uno) y "Destacar en la landing" (a lo sumo uno). */
export function PlanMarcaFields({ form, onExtra }: { form: PlanForm; onExtra: (c: Partial<PlanForm>) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <Field>
        <FieldLabel htmlFor="nivel-marca">Nivel de marca</FieldLabel>
        <Select value={form.nivelMarca} onValueChange={(v) => v && onExtra({ nivelMarca: v as NivelMarca })}>
          <SelectTrigger id="nivel-marca" className="w-full">
            <SelectValue>{(v: NivelMarca) => `${NIVELES[v]?.plan ?? v} (${v})`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ORDEN_NIVEL.map((n) => <SelectItem key={n} value={n}>{NIVELES[n].plan} ({n})</SelectItem>)}
          </SelectContent>
        </Select>
        <FieldDescription>{NIVELES[form.nivelMarca].incluye}.</FieldDescription>
      </Field>
      <label className="flex items-center gap-3 rounded-lg border border-border p-3 sm:mt-6">
        <Switch checked={form.destacado} onCheckedChange={(destacado) => onExtra({ destacado })} />
        <span className="text-sm">
          <span className="block font-medium">Destacar en la landing</span>
          <span className="block text-xs text-muted-foreground">Apaga el destacado de los demás.</span>
        </span>
      </label>
    </div>
  )
}
