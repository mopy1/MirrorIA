import { useState } from "react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { normalizarHex } from "@/lib/tema/color"

interface Props {
  id: string
  label: string
  value: string
  onChange: (hex: string) => void
  ayuda: string
}

/** Selector nativo + campo hex (acepta #abc, abcdef, minúsculas: siempre guarda #RRGGBB). */
export function CampoColor({ id, label, value, onChange, ayuda }: Props) {
  const [texto, setTexto] = useState(value)
  const [previo, setPrevio] = useState(value)
  if (previo !== value) {
    setPrevio(value)
    setTexto(value)
  }
  function escribir(v: string) {
    setTexto(v)
    const hex = normalizarHex(v)
    if (hex) onChange(hex)
  }
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: selector`}
          value={value.toLowerCase()}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-10 shrink-0 cursor-pointer rounded-lg border border-input bg-background p-1"
        />
        <Input id={id} value={texto} onChange={(e) => escribir(e.target.value)} onBlur={() => setTexto(value)} className="font-mono uppercase" maxLength={7} />
      </div>
      <FieldDescription>{ayuda}</FieldDescription>
    </Field>
  )
}
