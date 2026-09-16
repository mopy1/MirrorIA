import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { unsplashUrl } from "@/lib/unsplash"
import { BrandLogo } from "@/components/brand-logo"

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    // lg:h-dvh (alto FIJO, no min-height) le da a la fila del grid un tamaño
    // definido — necesario para que la imagen (lg:h-full + absolute inset-0)
    // se recorte a esa altura en vez de imponer su propio alto intrínseco
    // sobre toda la página (ver AGENTS.md: bug real corregido 2026-09-13).
    <div className="flex flex-col lg:grid lg:h-dvh lg:grid-cols-2">
      {/* Panel editorial — mismo motivo visual que el bento del inicio (foto +
          overlay de gradiente), oculto en mobile per la regla de colapso. */}
      <div className="relative hidden overflow-hidden lg:block lg:h-full">
        <img
          src={unsplashUrl("1759630752910-c4f9f628cf88", 1200, 1600)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link to="/" className="inline-block transition-opacity hover:opacity-90">
            <BrandLogo variant="light" size="lg" />
          </Link>
          <p className="max-w-sm text-3xl leading-tight font-medium text-white">
            Reservá, probátela, decidí. Nunca a ciegas.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-8 overflow-y-auto px-6 py-12 sm:px-12 lg:h-full lg:px-16">
        <Link to="/" className="inline-block lg:hidden transition-opacity hover:opacity-90">
          <BrandLogo size="lg" />
        </Link>

        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
