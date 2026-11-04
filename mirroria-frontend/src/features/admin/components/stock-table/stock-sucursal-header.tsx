import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Sucursal } from "@/features/branches/types/branches.types"

interface Props {
  sucursales: Sucursal[]
  sucursalId: string
  onChange: (id: string) => void
}

export function StockSucursalHeader({ sucursales, sucursalId, onChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h2 className="text-base font-semibold text-foreground tracking-tight">
        Stock por sucursal
      </h2>
      <div className="w-full sm:w-60">
        <Select value={sucursalId} onValueChange={(v) => onChange(v as string)}>
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Elegí una sucursal">
              {(id: string) => sucursales.find((s) => s.id === id)?.nombre ?? "Elegí una sucursal"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sucursales.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nombre} ({s.ciudadNombre})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
