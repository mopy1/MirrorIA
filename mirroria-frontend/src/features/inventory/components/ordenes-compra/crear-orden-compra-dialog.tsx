import type { FormEvent } from "react"
import { CircleNotch } from "@phosphor-icons/react"
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
import type { Sucursal } from "@/features/branches/types/branches.types"
import type { Proveedor } from "@/features/providers/types/providers.types"
import { useCrearOrdenForm, type OrdenInicial } from "../../hooks/useCrearOrdenForm"
import { OrdenCabeceraFields } from "./orden-cabecera-fields"
import { OrdenItemsSelector } from "./orden-items-selector"

interface Props extends OrdenInicial {
  open: boolean
  onOpenChange: (open: boolean) => void
  proveedores: Proveedor[]
  sucursales: Sucursal[]
  onSuccess: () => void
}

export function CrearOrdenCompraDialog({
  open,
  onOpenChange,
  proveedores,
  sucursales,
  onSuccess,
  ...inicial
}: Props) {
  const form = useCrearOrdenForm(open, inicial, () => {
    onOpenChange(false)
    onSuccess()
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    form.submit()
  }

  const isFormValid = form.proveedorId && form.sucursalDestinoId && form.items.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Compra</DialogTitle>
          <DialogDescription>Solicita reposición de prendas a un proveedor.</DialogDescription>
        </DialogHeader>
        {form.error && <Alert variant="destructive"><AlertDescription>{form.error}</AlertDescription></Alert>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup className="py-0 gap-3">
            <OrdenCabeceraFields
              proveedorId={form.proveedorId}
              onProveedorChange={form.setProveedorId}
              sucursalDestinoId={form.sucursalDestinoId}
              onSucursalChange={form.setSucursalDestinoId}
              fechaEsperada={form.fechaEsperada}
              onFechaChange={form.setFechaEsperada}
              proveedores={proveedores}
              sucursales={sucursales}
            />
            <OrdenItemsSelector
              key={`${inicial.initialVarianteId ?? ""}-${open}`}
              items={form.items}
              onChange={form.setItems}
              variantes={form.variantesDelProveedor}
              hayProveedor={Boolean(form.proveedorId)}
              initialVarianteId={inicial.initialVarianteId}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={form.isLoading || !isFormValid}>
              {form.isLoading && <CircleNotch data-icon="inline-start" className="animate-spin" />}
              {form.isLoading ? "Creando..." : "Crear Orden"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
