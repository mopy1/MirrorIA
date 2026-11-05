import { useState } from "react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { SeccionMarca } from "../types/plataforma.types"
import { AccionDialog } from "./accion-dialog"

const SECCIONES: { v: SeccionMarca; l: string }[] = [
  { v: "TODO", l: "Toda la apariencia" },
  { v: "MARCA", l: "Logo y favicon" },
  { v: "COLORES", l: "Colores y estilo" },
  { v: "PORTADA", l: "Portada" },
  { v: "IMAGENES", l: "Imágenes de secciones" },
  { v: "TEXTOS", l: "Textos y contacto" },
]

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  nombre: string
  isLoading: boolean
  error: string | null
  onConfirmar: (seccion: SeccionMarca, motivo: string) => Promise<boolean>
}

/** Moderación (CU40): restablece una sección de la marca con motivo obligatorio, que queda en la bitácora. */
export function RestablecerMarcaDialog({ open, onOpenChange, nombre, isLoading, error, onConfirmar }: Props) {
  const [seccion, setSeccion] = useState<SeccionMarca>("TODO")
  const [motivo, setMotivo] = useState("")
  const valido = motivo.trim().length >= 5 && motivo.trim().length <= 255
  async function confirmar() {
    if (await onConfirmar(seccion, motivo.trim())) onOpenChange(false)
  }
  return (
    <AccionDialog open={open} onOpenChange={onOpenChange} titulo={`Restablecer la marca de ${nombre}`} descripcion="Vuelve a los valores iniciales de la tienda. La dueña ve el cambio y el motivo queda en la bitácora." confirmar="Restablecer" destructivo isLoading={isLoading} error={error} deshabilitado={!valido} onConfirmar={confirmar}>
      <Field>
        <FieldLabel htmlFor="seccion-marca">Qué restablecer</FieldLabel>
        <Select value={seccion} onValueChange={(v) => v && setSeccion(v as SeccionMarca)}>
          <SelectTrigger id="seccion-marca" className="w-full">
            <SelectValue>{(v: SeccionMarca) => SECCIONES.find((s) => s.v === v)?.l ?? "Elegí"}</SelectValue>
          </SelectTrigger>
          <SelectContent>{SECCIONES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field data-invalid={motivo.length > 0 && !valido}>
        <FieldLabel htmlFor="motivo-marca">Motivo</FieldLabel>
        <Textarea id="motivo-marca" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} rows={3} placeholder="Ej.: la portada mostraba contenido que no es de moda" />
        <FieldDescription>Entre 5 y 255 caracteres.</FieldDescription>
      </Field>
    </AccionDialog>
  )
}
