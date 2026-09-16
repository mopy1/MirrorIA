import { MapPin } from "@phosphor-icons/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSucursales } from "../../hooks/useSucursales"

interface BranchPickerProps {
  value: string | null
  onChange: (sucursalId: string) => void
  label?: string
}

export function BranchPicker({ value, onChange, label = "Sucursal" }: BranchPickerProps) {
  const { sucursales, isLoading } = useSucursales()
  const placeholder = isLoading ? "Cargando sucursales..." : "Elegí una sucursal"

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <MapPin className="size-4 text-muted-foreground" />
        {label}
      </label>
      <Select
        value={value ?? ""}
        onValueChange={(next) => onChange(next as string)}
        disabled={isLoading || sucursales.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {(id: string) => {
              const sucursal = sucursales.find((s) => s.id === id)
              return sucursal ? `${sucursal.nombre} — ${sucursal.ciudadNombre}` : placeholder
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sucursales.map((sucursal) => (
            <SelectItem key={sucursal.id} value={sucursal.id}>
              {sucursal.nombre} — {sucursal.ciudadNombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
