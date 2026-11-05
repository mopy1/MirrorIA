import { useState } from "react"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatMoneyEntero } from "@/lib/money"
import { usePlanesPlataforma } from "../hooks/usePlanesPlataforma"
import { AccionDialog } from "./accion-dialog"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  actual: string
  isLoading: boolean
  error: string | null
  onConfirmar: (planCodigo: string) => Promise<boolean>
}

/** Cambia el plan de una tienda (409 si su uso supera los límites del nuevo). */
export function CambiarPlanInquilinoDialog({ open, onOpenChange, actual, isLoading, error, onConfirmar }: Props) {
  const planes = usePlanesPlataforma()
  const [codigo, setCodigo] = useState(actual)
  const activos = planes.items.filter((p) => p.activo)
  async function confirmar() {
    if (await onConfirmar(codigo)) onOpenChange(false)
  }
  return (
    <AccionDialog open={open} onOpenChange={onOpenChange} titulo="Cambiar plan" descripcion="El nuevo plan rige desde ya, con su precio congelado en la suscripción vigente." confirmar="Cambiar plan" isLoading={isLoading} error={error ?? planes.error} deshabilitado={codigo === actual} onConfirmar={confirmar}>
      <Field>
        <FieldLabel>Plan</FieldLabel>
        <Select value={codigo} onValueChange={(v) => setCodigo((v as string) ?? actual)}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v: string) => activos.find((p) => p.codigo === v)?.nombre ?? (planes.isLoading ? "Cargando..." : v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {activos.map((p) => (
              <SelectItem key={p.id} value={p.codigo}>{p.nombre} · {formatMoneyEntero(p.precioMensualCents)}/mes</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </AccionDialog>
  )
}
