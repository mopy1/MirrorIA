import { useState } from "react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AccionDialog } from "./accion-dialog"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  isLoading: boolean
  error: string | null
  onConfirmar: (dias: number) => Promise<boolean>
}

/** Extiende la vigencia de la suscripción (1-365 días). */
export function ExtenderDialog({ open, onOpenChange, isLoading, error, onConfirmar }: Props) {
  const [dias, setDias] = useState("14")
  const n = Number(dias)
  const valido = Number.isInteger(n) && n >= 1 && n <= 365
  async function confirmar() {
    if (await onConfirmar(n)) onOpenChange(false)
  }
  return (
    <AccionDialog open={open} onOpenChange={onOpenChange} titulo="Extender vigencia" descripcion="Suma días a la suscripción vigente. Si estaba vencida, se reabre (en prueba si nunca pagó)." confirmar={`Extender ${valido ? n : ""} días`} isLoading={isLoading} error={error} deshabilitado={!valido} onConfirmar={confirmar}>
      <Field data-invalid={!valido}>
        <FieldLabel htmlFor="dias">Días</FieldLabel>
        <Input id="dias" type="number" min={1} max={365} value={dias} onChange={(e) => setDias(e.target.value)} />
        <FieldDescription>Entre 1 y 365.</FieldDescription>
      </Field>
    </AccionDialog>
  )
}
