import { Link } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { FOOTER_COLUMNS } from "./site-footer.data"
import { BrandLogo } from "@/components/brand-logo"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <BrandLogo size="default" />
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
                        to={link.href}
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

        <Separator className="my-10" />

        <p className="text-xs text-muted-foreground">
          {new Date().getFullYear()} MirrorIA. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
