import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  id: string
  label: string
  value: string | null
  onChange: (v: string) => void
  max: number
  error?: string
  ayuda?: string
  placeholder?: string
  multilinea?: boolean
  prefijo?: string
}

/** Label arriba, ayuda y contador abajo, error debajo (design-taste §4.6). */
export function CampoTextoMarca({ id, label, value, onChange, max, error, ayuda, placeholder, multilinea, prefijo }: Props) {
  const v = value ?? ""
  const props = { id, value: v, placeholder, maxLength: max, "aria-invalid": !!error, onChange: (e: { target: { value: string } }) => onChange(e.target.value) }
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multilinea ? (
        <Textarea {...props} rows={4} />
      ) : prefijo ? (
        <div className="flex items-center rounded-lg border border-input bg-background pl-3 text-sm focus-within:ring-3 focus-within:ring-ring/50">
          <span className="text-muted-foreground">{prefijo}</span>
          <Input {...props} className="border-0 pl-0.5 focus-visible:ring-0" />
        </div>
      ) : (
        <Input {...props} />
      )}
      <div className="flex items-start justify-between gap-3">
        {error ? <FieldError>{error}</FieldError> : <FieldDescription>{ayuda ?? ""}</FieldDescription>}
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{v.length}/{max}</span>
      </div>
    </Field>
  )
}
