import { CoatHanger, MagnifyingGlass, Plus } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

/** Estado vacío de la tabla de prendas: sin prendas (tienda nueva) o sin resultados del filtro. */
export function ProductosEmpty({ hayFiltro, onCrear }: { hayFiltro: boolean; onCrear: () => void }) {
  const Icono = hayFiltro ? MagnifyingGlass : CoatHanger
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center whitespace-normal">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icono className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-foreground">
          {hayFiltro ? "Ninguna prenda coincide con la búsqueda" : "Todavía no cargaste prendas"}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {hayFiltro
            ? "Probá con otro nombre o elegí \"Todas las categorías\"."
            : "Ya tenés tallas, colores, categorías y una colección inicial listas: solo falta tu primera prenda."}
        </p>
      </div>
      {!hayFiltro && (
        <Button variant="outline" onClick={onCrear} className="gap-1.5">
          <Plus className="size-4" />
          Cargar mi primera prenda
        </Button>
      )}
    </div>
  )
}
