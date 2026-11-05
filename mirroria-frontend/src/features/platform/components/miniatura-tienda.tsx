import { ImagenMarca } from "@/components/marca/imagen-marca"
import { Monograma } from "@/components/marca/monograma"
import { textoSobre } from "@/lib/tema/color"
import type { MarcaMini } from "@/types/marca.types"
import { cn } from "cn"

/** 40×40 con la marca de la tienda: su logo sobre blanco o sus iniciales sobre SU color (dato, no token). */
export function MiniaturaTienda({ nombre, marca, className }: { nombre: string; marca?: MarcaMini; className?: string }) {
  const color = marca?.colorPrimario
  const mono = <Monograma nombre={nombre} className={cn("size-10 rounded-lg", className)} color={color} texto={color ? textoSobre(color) : undefined} />
  if (!marca?.logoUrl) return mono
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card p-1", className)}>
      <ImagenMarca src={marca.logoUrl} alt="" className="max-h-full max-w-full object-contain" respaldo={mono} />
    </span>
  )
}
