export interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Tienda",
    links: [
      { label: "Catálogo", href: "/tienda" },
      { label: "Vestidor virtual", href: "#vestidor" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Sucursales", href: "/sucursales" },
      { label: "Reservas", href: "#" },
      { label: "Contacto", href: "#contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y condiciones", href: "#" },
      { label: "Privacidad", href: "#" },
    ],
  },
]
