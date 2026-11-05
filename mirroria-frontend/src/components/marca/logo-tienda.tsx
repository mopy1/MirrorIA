import { cn } from "cn"
import { ImagenMarca } from "./imagen-marca"
import { Monograma } from "./monograma"

interface Props {
  nombre: string
  logoUrl: string | null | undefined
  className?: string
  /** Muestra el nombre al lado del logo (el header lo quiere, la miniatura no). */
  conNombre?: boolean
  /** Nombre en blanco (sobre una foto). */
  sobreFoto?: boolean
}

/** Logo de UNA tienda: su imagen o su monograma, y su nombre en la fuente de títulos de la marca. */
export function LogoTienda({ nombre, logoUrl, className, conNombre = true, sobreFoto = false }: Props) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <ImagenMarca
        src={logoUrl}
        alt={conNombre ? "" : nombre}
        className="h-8 max-w-40 shrink-0 object-contain"
        respaldo={<Monograma nombre={nombre} className="size-8" />}
      />
      {conNombre && <span className={cn("truncate font-heading text-lg font-semibold tracking-tight", sobreFoto ? "text-white" : "text-foreground")}>{nombre}</span>}
    </span>
  )
}
