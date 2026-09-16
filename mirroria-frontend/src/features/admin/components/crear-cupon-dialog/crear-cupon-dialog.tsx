import { useState } from "react"
import { CalendarBlank, Percent, Plus, Tag, Ticket } from "@phosphor-icons/react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CreateCuponDto, TipoDescuentoCupon } from "@/features/promotions/types/promotions.types"

interface CrearCuponDialogProps {
  onCrear: (dto: CreateCuponDto) => Promise<boolean>
  isLoading?: boolean
}

export function CrearCuponDialog({ onCrear, isLoading }: CrearCuponDialogProps) {
  const [open, setOpen] = useState(false)
  const [codigo, setCodigo] = useState("")
  const [tipoDescuento, setTipoDescuento] = useState<TipoDescuentoCupon>("PORCENTAJE")
  const [valorInput, setValorInput] = useState("")
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  })
  const [usosMaximosInput, setUsosMaximosInput] = useState("")
  const [montoMinimoBs, setMontoMinimoBs] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  function resetForm() {
    setCodigo("")
    setTipoDescuento("PORCENTAJE")
    setValorInput("")
    setUsosMaximosInput("")
    setMontoMinimoBs("")
    setFormError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const codigoTrim = codigo.trim().toUpperCase()
    if (!codigoTrim) {
      setFormError("El código del cupón es obligatorio")
      return
    }

    const valorNum = Number(valorInput)
    if (isNaN(valorNum) || valorNum <= 0) {
      setFormError("El valor de descuento debe ser un número mayor a 0")
      return
    }

    if (tipoDescuento === "PORCENTAJE" && valorNum > 100) {
      setFormError("El porcentaje de descuento no puede ser superior al 100%")
      return
    }

    if (!fechaInicio || !fechaFin) {
      setFormError("Debes especificar la fecha de inicio y de finalización")
      return
    }

    if (new Date(fechaFin) < new Date(fechaInicio)) {
      setFormError("La fecha de fin no puede ser anterior a la de inicio")
      return
    }

    const valorEnCentavos =
      tipoDescuento === "MONTO_FIJO" ? Math.round(valorNum * 100) : valorNum

    const dto: CreateCuponDto = {
      codigo: codigoTrim,
      tipoDescuento,
      valor: valorEnCentavos,
      fechaInicio: new Date(`${fechaInicio}T00:00:00.000Z`).toISOString(),
      fechaFin: new Date(`${fechaFin}T23:59:59.000Z`).toISOString(),
      usosMaximos: usosMaximosInput ? parseInt(usosMaximosInput, 10) : null,
      montoMinimoCents: montoMinimoBs ? Math.round(Number(montoMinimoBs) * 100) : null,
      activo: true,
    }

    const ok = await onCrear(dto)
    if (ok) {
      resetForm()
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        size="default"
        onClick={() => setOpen(true)}
        className="gap-2 shadow-xs"
      >
        <Plus className="size-4 shrink-0" data-icon="inline-start" />
        <span>Nuevo Cupón</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Ticket className="size-5" />
            </div>
            <div>
              <DialogTitle>Crear Cupón de Descuento</DialogTitle>
              <DialogDescription>
                Genera un código promocional para aplicar en checkout y tienda.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup className="gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="codigo">Código del Cupón</FieldLabel>
                <div className="relative">
                  <Input
                    id="codigo"
                    placeholder="EJ: VERANO20"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    className="font-mono uppercase tracking-wider"
                    required
                  />
                  <Tag className="absolute right-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="tipoDescuento">Tipo de Descuento</FieldLabel>
                <Select
                  value={tipoDescuento}
                  onValueChange={(val) => setTipoDescuento(val as TipoDescuentoCupon)}
                >
                  <SelectTrigger id="tipoDescuento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PORCENTAJE">Porcentaje (%)</SelectItem>
                    <SelectItem value="MONTO_FIJO">Monto Fijo (Bs.)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="valor">
                  {tipoDescuento === "PORCENTAJE" ? "Porcentaje de Descuento" : "Monto a descontar (Bs.)"}
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="valor"
                    type="number"
                    min="1"
                    max={tipoDescuento === "PORCENTAJE" ? "100" : undefined}
                    step={tipoDescuento === "PORCENTAJE" ? "1" : "0.5"}
                    placeholder={tipoDescuento === "PORCENTAJE" ? "Ej: 15" : "Ej: 50.00"}
                    value={valorInput}
                    onChange={(e) => setValorInput(e.target.value)}
                    required
                  />
                  {tipoDescuento === "PORCENTAJE" ? (
                    <Percent className="absolute right-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  ) : (
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono pointer-events-none">
                      BOB
                    </span>
                  )}
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="usosMaximos">Límite de Canjes (Opcional)</FieldLabel>
                <Input
                  id="usosMaximos"
                  type="number"
                  min="1"
                  placeholder="Ilimitado si se deja vacío"
                  value={usosMaximosInput}
                  onChange={(e) => setUsosMaximosInput(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="fechaInicio">Fecha de Inicio</FieldLabel>
                <div className="relative">
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    required
                  />
                  <CalendarBlank className="absolute right-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="fechaFin">Fecha de Vencimiento</FieldLabel>
                <div className="relative">
                  <Input
                    id="fechaFin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    required
                  />
                  <CalendarBlank className="absolute right-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="montoMinimo">Monto Mínimo de Compra en Bs. (Opcional)</FieldLabel>
              <Input
                id="montoMinimo"
                type="number"
                min="0"
                step="5"
                placeholder="Ej: 150.00 (sin mínimo si se deja vacío)"
                value={montoMinimoBs}
                onChange={(e) => setMontoMinimoBs(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Crear Cupón"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>
  )
}
