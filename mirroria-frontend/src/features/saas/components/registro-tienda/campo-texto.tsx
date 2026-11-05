import type { ComponentProps } from "react"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface CampoTextoProps extends Omit<ComponentProps<typeof Input>, "onChange"> {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
}

export function CampoTexto({ id, label, value, onChange, error, ...props }: CampoTextoProps) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} {...props} />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
