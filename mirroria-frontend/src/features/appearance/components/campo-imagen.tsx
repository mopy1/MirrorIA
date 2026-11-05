import { useEffect, useState, type ReactNode } from "react"
import { ImageSquare, Images, Trash } from "@phosphor-icons/react"
import type { GrupoGaleria } from "@/components/marca/galeria-imagenes.data"
import { ImagenMarca } from "@/components/marca/imagen-marca"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { GaleriaDialog } from "./galeria-dialog"

interface Props {
  id: string
  label: string
  value: string | null
  onChange: (v: string | null) => void
  grupo: GrupoGaleria
  error?: string
  ayuda?: string
  /** Qué se ve si no hay imagen (monograma para el logo). */
  respaldo?: ReactNode
  obligatoria?: boolean
}

/** URL (con 150 ms de pausa antes de tocar la vista previa) + galería + miniatura + quitar. */
export function CampoImagen({ id, label, value, onChange, grupo, error, ayuda, respaldo, obligatoria }: Props) {
  const [texto, setTexto] = useState(value ?? "")
  const [galeria, setGaleria] = useState(false)
  // Sincroniza cuando el valor cambia desde afuera (galería, restablecer, descartar).
  const [previo, setPrevio] = useState(value)
  if (previo !== value) {
    setPrevio(value)
    setTexto(value ?? "")
  }
  useEffect(() => {
    if (texto.trim() === (value ?? "")) return
    const t = setTimeout(() => onChange(texto.trim() === "" ? null : texto.trim()), 150)
    return () => clearTimeout(t)
  }, [texto, value, onChange])

  const vacio = <span className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"><ImageSquare className="size-6" /></span>
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex gap-3">
        <span className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          <ImagenMarca src={value} alt="" className="h-full w-full object-cover" respaldo={respaldo ?? vacio} />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <Input id={id} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="https://..." aria-invalid={!!error} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setGaleria(true)}>
              <Images /> Elegir de la galería
            </Button>
            {value && !obligatoria && (
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => onChange(null)}>
                <Trash /> Quitar
              </Button>
            )}
          </div>
        </div>
      </div>
      {error ? <FieldError>{error}</FieldError> : ayuda && <FieldDescription>{ayuda}</FieldDescription>}
      <GaleriaDialog open={galeria} onOpenChange={setGaleria} grupo={grupo} actual={value} onElegir={onChange} />
    </Field>
  )
}
