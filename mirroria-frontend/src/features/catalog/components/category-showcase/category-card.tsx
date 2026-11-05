import { ArrowUpRight, CoatHanger } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import type { Categoria, Producto } from "../../types/catalog.types"

/** Tarjeta de una categoría: foto de una prenda suya (o un fondo de marca si no hay) y su nombre. */
export function CategoryCard({ categoria, producto, href }: { categoria: Categoria; producto?: Producto; href: string }) {
  const imagenUrl = producto?.imagenes?.[0]?.url
  return (
    <Link
      to={href}
      className="group relative block overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <AspectRatio ratio={3 / 4}>
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt={categoria.nombre}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <>
            <div
              className="h-full w-full bg-muted transition-transform duration-500 ease-out group-hover:scale-105"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 70% 25%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 55%)",
              }}
            />
            <CoatHanger
              weight="light"
              className="absolute top-1/3 left-1/2 size-9 -translate-x-1/2 -translate-y-1/2 text-foreground/15"
            />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0 transition-colors duration-300 group-hover:from-black/90" />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-white leading-tight">{categoria.nombre}</p>
            {producto && <p className="text-xs text-white/75 truncate font-normal">{producto.titulo}</p>}
          </div>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <ArrowUpRight className="size-4" weight="bold" />
          </span>
        </div>
      </AspectRatio>
    </Link>
  )
}
