export interface NavItem {
  label: string
  href: string
  badge?: string
}

/** Enlaces centrales de navegación de la tienda boutique. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Colección", href: "/tienda" },
  { label: "Probador IA", href: "/probador", badge: "IA" },
  { label: "Sucursales", href: "/sucursales" },
]
