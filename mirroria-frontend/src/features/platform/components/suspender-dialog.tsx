import { useState } from "react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { AccionDialog } from "./accion-dialog"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  suspendida: boolean
  nombre: string
  isLoading: boolean
  error: string | null
  onConfirmar: (motivo?: string) => Promise<boolean>
}

/** Suspender (con motivo de 5-255) o reactivar una tienda. */
export function SuspenderDialog({ open, onOpenChange, suspendida, nombre, isLoading, error, onConfirmar }: Props) {
  const [motivo, setMotivo] = useState("")
  const corto = motivo.trim().length < 5
  async function confirmar() {
    if (await onConfirmar(suspendida ? undefined : motivo.trim())) onOpenChange(false)
  }
  return (
    <AccionDialog
      open={open}
      onOpenChange={onOpenChange}
      titulo={suspendida ? `Reactivar ${nombre}` : `Suspender ${nombre}`}
      descripcion={suspendida ? "La tienda vuelve a estar disponible para sus clientas (si su suscripción está vigente)." : "La tienda deja de estar disponible: sus clientas ven un aviso y el staff solo puede entrar a Plan y suscripción."}
      confirmar={suspendida ? "Reactivar tienda" : "Suspender tienda"}
      destructivo={!suspendida}
      isLoading={isLoading}
      error={error}
      deshabilitado={!suspendida && corto}
      onConfirmar={confirmar}
    >
      {!suspendida && (
        <Field>
          <FieldLabel htmlFor="motivo">Motivo</FieldLabel>
          <Textarea id="motivo" value={motivo} maxLength={255} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Contenido que infringe los términos" />
          <FieldDescription>Entre 5 y 255 caracteres. Lo ve la plataforma en el detalle.</FieldDescription>
        </Field>
      )}
    </AccionDialog>
  )
}
