import { CheckCircle, Tag, X } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Cupon } from "@/features/promotions/types/promotions.types"
import { formatMoney } from "@/lib/money"

interface CuponInputProps {
  codigo: string
  onCodigoChange: (codigo: string) => void
  onAplicar: () => void
  onRemover: () => void
  cuponAplicado: Cupon | null
  descuentoCents: number
  isLoading: boolean
  error: string | null
  mensajeExito: string | null
}

export function CuponInput({
  codigo,
  onCodigoChange,
  onAplicar,
  onRemover,
  cuponAplicado,
  descuentoCents,
  isLoading,
  error,
  mensajeExito,
}: CuponInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      onAplicar()
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Tag className="size-4 text-primary" />
          <span>Cupón de descuento</span>
        </label>
        {cuponAplicado && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle className="size-3.5" />
            Ahorras {formatMoney(descuentoCents)}
          </span>
        )}
      </div>

      {cuponAplicado ? (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono bg-background text-primary border-primary/30 uppercase tracking-wider">
              {cuponAplicado.codigo}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {cuponAplicado.tipoDescuento === "PORCENTAJE"
                ? `${cuponAplicado.valor}% de descuento`
                : `-${formatMoney(cuponAplicado.valor)}`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemover}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
          >
            <X className="size-3.5" />
            <span>Quitar</span>
          </Button>
        </div>
      ) : (
        <FieldGroup>
          <div className="flex gap-2">
            <Field className="flex-1">
              <Input
                placeholder="Código promocional (ej: VERANO20)"
                value={codigo}
                onChange={(e) => onCodigoChange(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="font-mono uppercase tracking-wider h-10"
                disabled={isLoading}
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              onClick={onAplicar}
              disabled={!codigo.trim() || isLoading}
              className="h-10 px-4 shrink-0 font-medium"
            >
              {isLoading ? "Validando..." : "Aplicar"}
            </Button>
          </div>
        </FieldGroup>
      )}

      {error && (
        <Alert variant="destructive" className="py-2 px-3 text-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {mensajeExito && !error && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          {mensajeExito}
        </p>
      )}
    </div>
  )
}
