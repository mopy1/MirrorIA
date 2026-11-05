import { Link } from "react-router-dom"
import { InsigniaTiendaria } from "@/components/marca/insignia-tiendaria"
import { LogoTiendaActual } from "@/components/marca/logo-tienda-actual"
import { useMarca } from "@/hooks/useMarca"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { useTienda } from "@/hooks/useTienda"
import { RedesTienda } from "./redes-tienda"
import { FOOTER_COLUMNS } from "./site-footer.data"

const linkClase = "text-sm text-muted-foreground transition-colors hover:text-foreground"

/** Pie de la tienda: su logo, eslogan, "sobre nosotras", redes y la insignia de Tiendaria (si su plan la muestra). */
export function SiteFooter() {
  const ruta = useRutaTienda()
  const { tienda } = useTienda()
  const marca = useMarca()

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <LogoTiendaActual />
            {marca?.textos.eslogan && <p className="mt-3 max-w-[36ch] text-sm font-medium text-foreground">{marca.textos.eslogan}</p>}
            <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">
              {marca?.textos.sobreNosotros ?? "Ropa de mujer con vestidor virtual y reservas por sucursal."}
            </p>
            {marca && <RedesTienda contacto={marca.contacto} />}
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-medium">{column.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link to={ruta(link.href)} className={linkClase}>{link.label}</Link>
                    ) : (
                      <a href={link.href} className={linkClase}>{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {new Date().getFullYear()} {tienda?.nombre}. Todos los derechos reservados.
          </p>
          {marca?.mostrarInsignia !== false && <InsigniaTiendaria />}
        </div>
      </div>
    </footer>
  )
}
