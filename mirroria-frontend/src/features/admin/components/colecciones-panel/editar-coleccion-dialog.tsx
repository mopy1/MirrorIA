import { useEffect, useState, type FormEvent } from "react"
import { Check, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { catalogApi } from "@/features/catalog/api/catalogApi"
import type { Coleccion, Temporada } from "@/features/catalog/types/catalog.types"
import type { Proveedor } from "@/features/providers/types/providers.types"

interface EditarColeccionDialogProps {
  coleccion: Coleccion | null
  open: boolean
  onOpenChange: (open: boolean) => void
  temporadas: Temporada[]
  proveedores: Proveedor[]
  onUpdated: () => void
}

export function EditarColeccionDialog({
  coleccion,
  open,
  onOpenChange,
  temporadas,
  proveedores,
  onUpdated,
}: EditarColeccionDialogProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [temporadaId, setTemporadaId] = useState("")
  const [proveedorId, setProveedorId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (coleccion) {
      setNombre(coleccion.nombre)
      setDescripcion(coleccion.descripcion ?? "")
      setTemporadaId(coleccion.temporadaId)
      setProveedorId(coleccion.proveedorId ?? "")
      setError(null)
    }
  }, [coleccion])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!coleccion) return
    setIsLoading(true)
    setError(null)
    try {
      await catalogApi.updateColeccion(coleccion.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        temporadaId,
        proveedorId,
      })
      onUpdated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la colección")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar colección</DialogTitle>
          <DialogDescription>
            Modifica los datos de la colección o asigna un proveedor de confección.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel>Nombre *</FieldLabel>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </Field>

            <Field>
              <FieldLabel>Descripción</FieldLabel>
              <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
            </Field>

            <Field>
              <FieldLabel>Temporada *</FieldLabel>
              <Select value={temporadaId} onValueChange={(v) => setTemporadaId(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar temporada">
                    {(id: string) => temporadas.find((t) => t.id === id)?.nombre ?? "Seleccionar"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {temporadas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Proveedor asignado *</FieldLabel>
              <Select value={proveedorId} onValueChange={(v) => setProveedorId(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar proveedor">
                    {(id: string) => proveedores.find((p) => p.id === id)?.razonSocial ?? "Seleccionar"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {error && (
            <Alert variant="destructive" className="py-2 text-xs">
              <WarningCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="gap-1.5">
              <Check className="size-3.5" />
              <span>{isLoading ? "Guardando..." : "Guardar cambios"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
