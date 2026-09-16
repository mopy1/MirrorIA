import { Link } from "react-router-dom"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { useCategorias } from "@/features/catalog/hooks/useCategorias"

/** Dropdown de categorías reales (no una lista fija) en la navbar. */
export function CategoriesMenu() {
  const { categorias } = useCategorias()
  if (categorias.length === 0) return null

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Categorías</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-48 gap-0.5 p-1">
              {categorias.map((categoria) => (
                <li key={categoria.id}>
                  <NavigationMenuLink
                    closeOnClick
                    render={<Link to={`/tienda?categoria=${categoria.id}`}>{categoria.nombre}</Link>}
                  />
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
