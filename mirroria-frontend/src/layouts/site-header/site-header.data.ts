export interface NavItem {
  label: string
  href: string
}

// "Categorías" no está acá: se arma en vivo desde useCategorias() dentro del
// header, no es una lista estática.
export const NAV_ITEMS: NavItem[] = [
  { label: "Tienda", href: "/tienda" },
  { label: "Sucursales", href: "/sucursales" },
]
