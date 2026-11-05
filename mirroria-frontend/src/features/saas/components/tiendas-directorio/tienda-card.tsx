import { Link } from "react-router-dom"
import { ImagenMarca } from "@/components/marca/imagen-marca"
import { Monograma } from "@/components/marca/monograma"
import { textoSobre } from "@/lib/tema/color"
import { marcaDe } from "@/lib/tema/marca.constants"
import type { TiendaPublica } from "@/types/tienda.types"

/**
 * Tarjeta del directorio con la marca de ESA tienda: su portada y una franja
 * de su color principal con texto calculado. Los colores son datos de la
 * tienda (estilo inline), no tokens de Tiendaria.
 */
export function TiendaCard({ tienda }: { tienda: TiendaPublica }) {
  const marca = marcaDe(tienda)
  const texto = textoSobre(marca.colorPrimario)
  return (
    <Link to={`/t/${tienda.slug}`} className="group block overflow-hidden rounded-2xl border border-border/60 bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <ImagenMarca
          src={marca.hero.imagenUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.02]"
          respaldo={<div className="h-full w-full bg-muted" />}
        />
      </div>
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: marca.colorPrimario, color: texto }}>
        {marca.logoUrl ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white p-1">
            <ImagenMarca src={marca.logoUrl} alt="" className="max-h-full max-w-full object-contain" respaldo={<Monograma nombre={tienda.nombre} className="size-8" />} />
          </span>
        ) : (
          <Monograma nombre={tienda.nombre} className="size-10 border border-current/30 bg-transparent" texto={texto} color="transparent" />
        )}
        <span className="min-w-0">
          <span className="block truncate font-semibold">{tienda.nombre}</span>
          <span className="block truncate text-sm opacity-80">{marca.textos.eslogan ?? `/t/${tienda.slug}`}</span>
        </span>
      </div>
    </Link>
  )
}
