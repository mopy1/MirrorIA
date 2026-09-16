import { CoatHanger } from "@phosphor-icons/react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { cn } from "cn"

interface ProductImagePlaceholderProps {
  ratio?: number
  className?: string
  iconClassName?: string
}

/**
 * Reemplaza `producto.imagenes` mientras no exista un pipeline real de assets
 * (subida, CDN, `imagenes[].url` confiable) — a propósito NO se renderiza esa
 * URL todavía (algunos productos sembrados de prueba tienen una URL dummy
 * `example.test` que rompería como <img src>). Placeholder con textura e
 * ícono de marca, no una caja gris plana ni un ícono de imagen rota.
 */
export function ProductImagePlaceholder({
  ratio = 3 / 4,
  className,
  iconClassName,
}: ProductImagePlaceholderProps) {
  return (
    <AspectRatio ratio={ratio} className={cn("overflow-hidden rounded-2xl", className)}>
      <div
        className="relative flex h-full w-full items-center justify-center bg-muted"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 60%), repeating-linear-gradient(135deg, color-mix(in oklch, var(--foreground) 4%, transparent) 0px, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px, transparent 14px)",
        }}
      >
        <CoatHanger
          weight="light"
          className={cn("size-10 text-muted-foreground/35", iconClassName)}
        />
      </div>
    </AspectRatio>
  )
}
