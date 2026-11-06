import { CaretDown, Tag } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCategorias } from "@/features/catalog/hooks/useCategorias"
import { useRutaTienda } from "@/hooks/useRutaTienda"

/** Menú desplegable flotante de categorías reales con animación limpia. */
export function CategoriesDropdown() {
  const ruta = useRutaTienda()
  const { categorias, isLoading } = useCategorias()

  if (categorias.length === 0 && !isLoading) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="group h-8 gap-1 rounded-md px-2.5 text-xs font-medium tracking-wide text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <span>Categorías</span>
            <CaretDown className="size-3 opacity-60 transition-transform duration-200 group-data-popup-open:rotate-180" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-52 p-1.5 shadow-xl">
        {categorias.map((cat) => (
          <DropdownMenuItem
            key={cat.id}
            render={
              <Link
                to={ruta(`/tienda?categoria=${cat.id}`)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground/90 transition-colors hover:bg-muted hover:text-foreground"
              >
                <Tag className="size-3 text-muted-foreground/70" />
                <span className="truncate">{cat.nombre}</span>
              </Link>
            }
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
