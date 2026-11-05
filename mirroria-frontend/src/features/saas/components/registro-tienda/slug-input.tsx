import { CheckCircle, CircleNotch, WarningCircle } from "@phosphor-icons/react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { EstadoSlug } from "../../hooks/useDisponibilidadSlug"

interface SlugInputProps {
  value: string
  onChange: (v: string) => void
  estado: EstadoSlug
  error?: string
}

/** Dirección de la tienda con chequeo en vivo (`useDisponibilidadSlug`). */
export function SlugInput({ value, onChange, estado, error }: SlugInputProps) {
  const mal = !!error || estado.tipo === "invalido" || estado.tipo === "no-disponible"
  const mensaje =
    error ??
    (estado.tipo === "invalido" || estado.tipo === "no-disponible"
      ? estado.mensaje
      : estado.tipo === "disponible"
        ? "¡Disponible! Así te van a encontrar tus clientas."
        : estado.tipo === "verificando"
          ? "Verificando..."
          : estado.tipo === "error"
            ? "No pudimos verificarla ahora; se valida al crear la tienda."
            : "Minúsculas, números y guiones.")
  return (
    <Field data-invalid={mal}>
      <FieldLabel htmlFor="slug">Dirección de tu tienda</FieldLabel>
      <div className="flex items-center rounded-lg border border-input bg-background pl-3 text-sm focus-within:ring-3 focus-within:ring-ring/50">
        <span className="shrink-0 text-muted-foreground">mirroria.app/t/</span>
        <Input id="slug" value={value} onChange={(e) => onChange(e.target.value.toLowerCase())} aria-invalid={mal} className="border-0 pl-0.5 focus-visible:ring-0" placeholder="boutique-lila" />
        <span className="pr-3">
          {estado.tipo === "verificando" && <CircleNotch className="size-4 animate-spin text-muted-foreground" />}
          {estado.tipo === "disponible" && <CheckCircle weight="fill" className="size-4 text-emerald-600 dark:text-emerald-400" />}
          {mal && <WarningCircle weight="fill" className="size-4 text-destructive" />}
        </span>
      </div>
      <FieldDescription className={mal ? "text-destructive" : estado.tipo === "disponible" ? "text-emerald-600 dark:text-emerald-400" : undefined}>
        {mensaje}
      </FieldDescription>
    </Field>
  )
}
