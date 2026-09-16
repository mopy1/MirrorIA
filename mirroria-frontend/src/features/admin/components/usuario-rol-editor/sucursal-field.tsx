import { WarningCircle } from "@phosphor-icons/react"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Sucursal } from "@/features/branches/types/branches.types"

interface SucursalFieldProps {
  sucursalId: string
  onSucursalChange: (id: string) => void
  sucursales: Sucursal[]
  sucursalInvalida: boolean
}

export function SucursalField({
  sucursalId,
  onSucursalChange,
  sucursales,
  sucursalInvalida,
}: SucursalFieldProps) {
  return (
    <Field data-invalid={sucursalInvalida}>
      <FieldLabel>
        Sucursal asignada <span className="text-destructive">*</span>
      </FieldLabel>
      <Select value={sucursalId} onValueChange={(v) => onSucursalChange(v as string)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar sucursal">
            {(id: string) => sucursales.find((s) => s.id === id)?.nombre ?? "Seleccionar sucursal"}
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
      {sucursalInvalida ? (
        <FieldError className="flex items-center gap-1 text-xs">
          <WarningCircle className="size-3.5 shrink-0" />
          Este rol requiere asignar una sucursal obligatoriamente.
        </FieldError>
      ) : (
        <FieldDescription>La sede física donde operará el usuario.</FieldDescription>
      )}
    </Field>
  )
}
