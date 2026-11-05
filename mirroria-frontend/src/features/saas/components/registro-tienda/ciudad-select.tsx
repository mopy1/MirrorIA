import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Ciudad } from "@/features/branches/types/branches.types"

interface CiudadSelectProps {
  ciudades: Ciudad[]
  isLoading: boolean
  value: string
  onChange: (id: string) => void
  error?: string
}

export function CiudadSelect({ ciudades, isLoading, value, onChange, error }: CiudadSelectProps) {
  const placeholder = isLoading ? "Cargando ciudades..." : ciudades.length === 0 ? "No hay ciudades cargadas" : "Elegí la ciudad"
  return (
    <Field data-invalid={!!error}>
      <FieldLabel>Ciudad</FieldLabel>
      <Select value={value} onValueChange={(v) => onChange((v as string) ?? "")} disabled={isLoading || ciudades.length === 0}>
        <SelectTrigger className="w-full" aria-invalid={!!error}>
          <SelectValue>{(id: string) => ciudades.find((c) => c.id === id)?.nombre ?? placeholder}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ciudades.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.nombre}, {c.pais}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
