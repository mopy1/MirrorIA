import { Plus, WarningCircle } from "@phosphor-icons/react"
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
import { FieldGroup } from "@/components/ui/field"
import { ResourceField } from "./resource-field"
import type { FieldConfig } from "./simple-resource-manager"

interface ResourceCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  fields: FieldConfig[]
  values: Record<string, string>
  onValueChange: (name: string, value: string) => void
  onSubmit: (event: React.FormEvent) => void
  isCreating: boolean
  createError: string | null
}

export function ResourceCreateDialog({
  open,
  onOpenChange,
  title,
  fields,
  values,
  onValueChange,
  onSubmit,
  isCreating,
  createError,
}: ResourceCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo registro en {title}</DialogTitle>
          <DialogDescription>
            Ingresa la información para agregar un nuevo elemento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 py-2">
          <FieldGroup className="gap-3.5">
            {fields.map((f) => (
              <ResourceField
                key={f.name}
                field={f}
                value={values[f.name] ?? ""}
                onChange={(val) => onValueChange(f.name, val)}
              />
            ))}
          </FieldGroup>

          {createError && (
            <Alert variant="destructive" className="py-2 text-xs">
              <WarningCircle className="size-4" />
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating} className="gap-1.5">
              <Plus className="size-3.5" />
              {isCreating ? "Guardando..." : "Guardar registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
