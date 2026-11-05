import { useState } from "react"
import { CircleNotch, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useCreateResource } from "@/hooks/useCreateResource"
import { plataformaApi } from "../api/plataformaApi"

/** "Nueva ciudad" (solo la plataforma: las ciudades son globales). 409 si ya existe en el país. */
export function CiudadFormDialog({ open, onOpenChange, onCreada }: { open: boolean; onOpenChange: (o: boolean) => void; onCreada: () => void }) {
  const [nombre, setNombre] = useState("")
  const [pais, setPais] = useState("Bolivia")
  const { submit, isLoading, error } = useCreateResource(plataformaApi.crearCiudad)

  async function guardar() {
    if (await submit({ nombre: nombre.trim(), pais: pais.trim() })) {
      onCreada()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva ciudad</DialogTitle>
          <DialogDescription>Queda disponible para las sucursales de todas las tiendas.</DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-3.5">
          <Field>
            <FieldLabel htmlFor="ciudad-nombre">Ciudad</FieldLabel>
            <Input id="ciudad-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Montero" />
          </Field>
          <Field>
            <FieldLabel htmlFor="ciudad-pais">País</FieldLabel>
            <Input id="ciudad-pais" value={pais} onChange={(e) => setPais(e.target.value)} />
          </Field>
        </FieldGroup>
        {error && <Alert variant="destructive"><WarningCircle weight="fill" /><AlertDescription>{error}</AlertDescription></Alert>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={guardar} disabled={isLoading || nombre.trim().length < 2 || pais.trim().length < 2} className="gap-2">
            {isLoading && <CircleNotch className="size-4 animate-spin" />}
            Crear ciudad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
