import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { FieldConfig } from "./simple-resource-manager"

interface ResourceFieldProps {
  field: FieldConfig
  value: string
  onChange: (value: string) => void
}

export function ResourceField({ field, value, onChange }: ResourceFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </FieldLabel>
      {field.type === "textarea" ? (
        <Textarea
          id={field.name}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Ingresa ${field.label.toLowerCase()}...`}
        />
      ) : field.type === "select" ? (
        <Select value={value} onValueChange={(next) => onChange(next as string)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`}>
              {(v: string) => field.options?.find((o) => o.value === v)?.label ?? `Seleccionar ${field.label.toLowerCase()}`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={field.name}
          type={field.type ?? "text"}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Ingresa ${field.label.toLowerCase()}...`}
        />
      )}
    </Field>
  )
}
