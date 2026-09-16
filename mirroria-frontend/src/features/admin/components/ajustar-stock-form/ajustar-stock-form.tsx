import { useState, type FormEvent } from "react"
import { CheckCircle, FloppyDisk, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Sucursal } from "@/features/branches/types/branches.types"
import { useVariantesConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import { inventoryApi } from "@/features/inventory/api/inventoryApi"
import { useCreateResource } from "@/hooks/useCreateResource"

interface AjustarStockFormProps {
  sucursales: Sucursal[]
  onAjustado?: () => void
}

export function AjustarStockForm({ sucursales, onAjustado }: AjustarStockFormProps) {
  const { variantes } = useVariantesConProducto()
  const { submit, isLoading, error } = useCreateResource(inventoryApi.ajustarStock)

  const [varianteId, setVarianteId] = useState("")
  const [sucursalId, setSucursalId] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [motivo, setMotivo] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFeedback(null)
    const result = await submit({ varianteId, sucursalId, cantidad: Number(cantidad), motivo })
    if (result) {
      setFeedback(`Ajuste aplicado: nuevo stock disponible ${result.cantidadDisponible} u.`)
      setCantidad("")
      setMotivo("")
      onAjustado?.()
    }
  }

  return (
    <Card className="border bg-card shadow-xs self-start">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Ajuste manual de stock</CardTitle>
        <CardDescription className="text-xs">
          Registra entradas, mermas o correcciones de conteo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <FieldGroup className="py-0 gap-3">
            <Field>
              <FieldLabel>Producto y Variante</FieldLabel>
              <Select value={varianteId} onValueChange={(v) => setVarianteId(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegí una variante">
                    {(id: string) => {
                      const v = variantes.find((item) => item.varianteId === id)
                      return v ? `${v.productoTitulo} (${v.tallaNombre} · ${v.colorNombre})` : "Elegí una variante"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {variantes.map((v) => (
                    <SelectItem key={v.varianteId} value={v.varianteId}>
                      {v.productoTitulo} ({v.tallaNombre} · {v.colorNombre})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Sucursal</FieldLabel>
              <Select value={sucursalId} onValueChange={(v) => setSucursalId(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegí una sucursal">
                    {(id: string) => sucursales.find((s) => s.id === id)?.nombre ?? "Elegí una sucursal"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="cantidad">Cantidad (+ ingreso, - egreso)</FieldLabel>
              <Input
                id="cantidad"
                type="number"
                required
                placeholder="Ej. 10 o -2"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
              <FieldDescription>Usa números negativos para reportar pérdidas o mermas.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="motivo">Motivo del ajuste</FieldLabel>
              <Input
                id="motivo"
                required
                placeholder="Ej. Conteo físico mensual"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </Field>
          </FieldGroup>

          {error && (
            <Alert variant="destructive" className="py-2 text-xs">
              <WarningCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {feedback && (
            <Alert className="py-2 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="size-4" />
              <AlertDescription>{feedback}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading} className="mt-1 w-full gap-1.5 text-xs h-9">
            <FloppyDisk className="size-3.5" />
            {isLoading ? "Aplicando..." : "Aplicar ajuste"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
