import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Sucursal } from "@/features/branches/types/branches.types"
import type { Proveedor } from "@/features/providers/types/providers.types"

interface Props {
  proveedorId: string
  onProveedorChange: (v: string) => void
  sucursalDestinoId: string
  onSucursalChange: (v: string) => void
  fechaEsperada: string
  onFechaChange: (v: string) => void
  proveedores: Proveedor[]
  sucursales: Sucursal[]
}

export function OrdenCabeceraFields({
  proveedorId,
  onProveedorChange,
  sucursalDestinoId,
  onSucursalChange,
  fechaEsperada,
  onFechaChange,
  proveedores,
  sucursales,
}: Props) {
  return (
    <>
      <Field>
        <FieldLabel>Proveedor</FieldLabel>
        <Select value={proveedorId} onValueChange={(v) => onProveedorChange(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar proveedor">
              {(id: string) => proveedores.find((p) => p.id === id)?.razonSocial ?? "Seleccionar proveedor"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {proveedores.map((p) => <SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Sucursal destino</FieldLabel>
        <Select value={sucursalDestinoId} onValueChange={(v) => onSucursalChange(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar sucursal">
              {(id: string) => sucursales.find((s) => s.id === id)?.nombre ?? "Seleccionar sucursal"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {sucursales.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Fecha esperada (opcional)</FieldLabel>
        <Input
          type="date"
          min={new Date().toLocaleDateString("en-CA")}
          value={fechaEsperada}
          onChange={(e) => onFechaChange(e.target.value)}
        />
      </Field>
    </>
  )
}
