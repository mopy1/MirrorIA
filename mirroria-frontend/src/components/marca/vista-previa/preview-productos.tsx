import { CoatHanger } from "@phosphor-icons/react"
import { formatMoney } from "@/lib/money"
import { cn } from "cn"
import { ImagenMarca } from "../imagen-marca"
import type { ProductoMini } from "./tipos"

const RELLENO: ProductoMini[] = [
  { id: "a", nombre: "Tu prenda", precioCents: 0, imagenUrl: null },
  { id: "b", nombre: "Tu prenda", precioCents: 0, imagenUrl: null },
  { id: "c", nombre: "Tu prenda", precioCents: 0, imagenUrl: null },
]

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
      <CoatHanger className="size-10" weight="light" />
    </div>
  )
}

/** Tres tarjetas de producto: las prendas reales de la tienda o tarjetas vacías si todavía no cargó ninguna. */
export function PreviewProductos({ productos, celular }: { productos?: ProductoMini[]; celular: boolean }) {
  const lista = (productos && productos.length > 0 ? productos : RELLENO).slice(0, celular ? 2 : 3)
  return (
    <div className={cn("bg-background", celular ? "px-4 py-8" : "px-10 py-12")}>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">Lo nuevo</h2>
      <div className={cn("mt-6 grid gap-5", celular ? "grid-cols-2" : "grid-cols-3")}>
        {lista.map((p, i) => (
          <div key={p.id}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
              <ImagenMarca src={p.imagenUrl} alt="" className="h-full w-full object-cover" respaldo={<Placeholder />} />
              {i === 0 && (
                <span className="absolute top-3 left-3 rounded-md bg-brand-accent px-2 py-0.5 text-xs font-semibold text-brand-accent-foreground">Nuevo</span>
              )}
            </div>
            <p className="mt-3 truncate text-sm font-medium text-foreground">{p.nombre}</p>
            <p className="text-sm text-muted-foreground">{p.precioCents > 0 ? formatMoney(p.precioCents) : "Tu precio"}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
