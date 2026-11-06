import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Sucursal } from "@/features/branches/types/branches.types"
import {
  DIMENSIONES_DISPONIBLES,
  METRICAS_DISPONIBLES,
  RANGOS_PRESET,
} from "./constructor-reporte.data"

interface Props {
  metrica: string
  setMetrica: (v: string) => void
  agruparPor: string
  setAgruparPor: (v: string) => void
  presetFecha: string
  setPresetFecha: (v: string) => void
  sucursalId: string
  setSucursalId: (v: string) => void
  comparar: boolean
  setComparar: (v: boolean) => void
  sucursales: Sucursal[]
}

export function ConstructorReporteCampos({
  metrica,
  setMetrica,
  agruparPor,
  setAgruparPor,
  presetFecha,
  setPresetFecha,
  sucursalId,
  setSucursalId,
  comparar,
  setComparar,
  sucursales,
}: Props) {
  return (
    <div className="grid gap-3.5 py-2">
      <div className="space-y-1">
        <Label className="text-xs">Métrica Principal</Label>
        <Select value={metrica} onValueChange={(v) => setMetrica(v as string)}>
          <SelectTrigger className="h-8.5 w-full text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {METRICAS_DISPONIBLES.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Dimensión (Agrupar por)</Label>
        <Select value={agruparPor} onValueChange={(v) => setAgruparPor(v as string)}>
          <SelectTrigger className="h-8.5 w-full text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DIMENSIONES_DISPONIBLES.map((d) => (
              <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <Label className="text-xs">Rango Temporal</Label>
          <Select value={presetFecha} onValueChange={(v) => setPresetFecha(v as string)}>
            <SelectTrigger className="h-8.5 w-full text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGOS_PRESET.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-xs">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sucursal</Label>
          <Select value={sucursalId} onValueChange={(v) => setSucursalId(v as string)}>
            <SelectTrigger className="h-8.5 w-full text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas" className="text-xs">Todas las sucursales</SelectItem>
              {sucursales.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">{s.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between border-t pt-2.5">
        <Label htmlFor="comp-sw" className="text-xs cursor-pointer">Comparar con período anterior</Label>
        <Switch id="comp-sw" checked={comparar} onCheckedChange={setComparar} />
      </div>
    </div>
  )
}
