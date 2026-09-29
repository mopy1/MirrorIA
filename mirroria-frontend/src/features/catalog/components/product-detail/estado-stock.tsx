import { CheckCircle, Warning } from "@phosphor-icons/react"
import { cn } from "cn"

/** Línea de disponibilidad de la variante elegida en la sucursal elegida. */
export function EstadoStock({ cantidadDisponible }: { cantidadDisponible: number }) {
  const sinStock = cantidadDisponible === 0
  return (
    <p
      className={cn(
        "mt-3 flex items-center gap-1.5 text-sm",
        sinStock ? "text-destructive" : "text-foreground"
      )}
    >
      {sinStock ? <Warning className="size-4" /> : <CheckCircle className="size-4" />}
      {sinStock ? "Sin stock en esta sucursal" : `${cantidadDisponible} disponibles en esta sucursal`}
    </p>
  )
}
