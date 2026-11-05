import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { PlanForm } from "../lib/plan-form"

type Campo = Exclude<keyof PlanForm, "activo">

function Campo({ id, label, value, onChange, ...rest }: { id: Campo; label: string; value: string; onChange: (c: Campo, v: string) => void } & Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange">) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} value={value} onChange={(e) => onChange(id, e.target.value)} {...rest} />
    </Field>
  )
}

export function PlanFormFields({ form, creando, onChange }: { form: PlanForm; creando: boolean; onChange: (c: Campo, v: string) => void }) {
  return (
    <FieldGroup className="gap-3.5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo id="codigo" label="Código" value={form.codigo} onChange={onChange} disabled={!creando} placeholder="crecimiento" />
        <Campo id="nombre" label="Nombre" value={form.nombre} onChange={onChange} placeholder="Crecimiento" />
      </div>
      <Field>
        <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
        <Textarea id="descripcion" value={form.descripcion} onChange={(e) => onChange("descripcion", e.target.value)} rows={2} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-4">
        <Campo id="precioBs" label="Bs / mes" type="number" min={0} step="0.01" value={form.precioBs} onChange={onChange} />
        <Campo id="precioUsd" label="USD / mes" type="number" min={0} step="0.01" value={form.precioUsd} onChange={onChange} />
        <Campo id="diasPrueba" label="Días prueba" type="number" min={0} max={60} value={form.diasPrueba} onChange={onChange} />
        <Campo id="orden" label="Orden" type="number" value={form.orden} onChange={onChange} />
      </div>
      <FieldSeparator>Límites (vacío = ilimitado)</FieldSeparator>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo id="maxSucursales" label="Sucursales" type="number" min={1} placeholder="∞" value={form.maxSucursales} onChange={onChange} />
        <Campo id="maxProductos" label="Prendas activas" type="number" min={1} placeholder="∞" value={form.maxProductos} onChange={onChange} />
        <Campo id="maxUsuariosStaff" label="Staff" type="number" min={1} placeholder="∞" value={form.maxUsuariosStaff} onChange={onChange} />
      </div>
    </FieldGroup>
  )
}
