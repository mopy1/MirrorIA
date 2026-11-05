import { Link } from "react-router-dom"
import { PlataformaLogo } from "@/components/marca/plataforma-logo"
import { SLUG_DEMO } from "@/lib/rutas-tienda"

const COLUMNAS = [
  {
    titulo: "Producto",
    links: [
      { label: "Planes", to: "/#planes" },
      { label: "Comparar planes", to: "/planes" },
      { label: "Tiendas", to: "/#tiendas" },
      { label: "Preguntas", to: "/#preguntas" },
    ],
  },
  {
    titulo: "Cuenta",
    links: [
      { label: "Entrar", to: "/entrar" },
      { label: "Crear mi tienda", to: "/registro-tienda" },
      { label: "Tienda demo", to: `/t/${SLUG_DEMO}` },
      { label: "Acceso plataforma", to: "/plataforma/login" },
    ],
  },
]

export function SaasFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <PlataformaLogo />
          <p className="mt-3 max-w-[36ch] text-sm text-muted-foreground">Tiendas online con tu marca.</p>
        </div>
        {COLUMNAS.map((col) => (
          <div key={col.titulo}>
            <p className="text-sm font-medium">{col.titulo}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted-foreground sm:px-6">© {new Date().getFullYear()} MirrorIA. Hecho en Bolivia.</p>
    </footer>
  )
}
