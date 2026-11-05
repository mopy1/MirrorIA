import { Link } from "react-router-dom"
import { FOOTER_COLUMNS } from "./site-footer.data"
import { TiendaLogo } from "@/components/tienda-logo"
import { useTienda } from "@/hooks/useTienda"
import { useRutaTienda } from "@/hooks/useRutaTienda"

export function SiteFooter() {
  const ruta = useRutaTienda()
  const { tienda } = useTienda()
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <TiendaLogo />
            <p className="mt-3 max-w-[28ch] text-sm text-muted-foreground">
              Ropa de mujer con vestidor virtual y reservas por sucursal.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-medium">{column.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        to={ruta(link.href)}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {new Date().getFullYear()} {tienda?.nombre ?? "MirrorIA"}. Todos los derechos reservados.
          </p>
          <p>
            Tienda creada con MirrorIA ·{" "}
            <Link to="/" className="font-medium text-primary underline-offset-4 hover:underline">
              Creá la tuya
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
