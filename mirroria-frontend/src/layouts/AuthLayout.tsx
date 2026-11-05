import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ImagenMarca } from "@/components/marca/imagen-marca"
import { LogoTienda } from "@/components/marca/logo-tienda"
import { TiendariaLogo } from "@/components/marca/tiendaria-logo"
import { useMarca } from "@/hooks/useMarca"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { useTienda } from "@/hooks/useTienda"
import { unsplashUrl } from "@/lib/unsplash"

const FOTO_GENERICA = unsplashUrl("1759630752910-c4f9f628cf88", 1200, 1600)

/**
 * Split-screen de login/registro. Dentro de `/t/:slug` es de la tienda (su
 * foto de acceso, su logo); fuera (acceso plataforma) es de Tiendaria.
 * `lg:h-dvh` fijo: la foto `absolute inset-0` se recorta a esa altura.
 */
export function AuthLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const { tienda } = useTienda()
  const marca = useMarca()
  const ruta = useRutaTienda()
  const foto = marca ? (marca.imagenes.acceso ?? marca.hero.imagenUrl) : FOTO_GENERICA
  const logo = (sobreFoto: boolean) =>
    tienda ? <LogoTienda nombre={tienda.nombre} logoUrl={marca?.logoUrl} sobreFoto={sobreFoto} /> : <TiendariaLogo size="lg" className={sobreFoto ? "text-white" : undefined} />

  return (
    <div className="flex flex-col bg-background lg:grid lg:h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block lg:h-full">
        <ImagenMarca
          src={foto}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          respaldo={<img src={FOTO_GENERICA} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link to={ruta("/")} className="inline-block w-fit transition-opacity hover:opacity-90">{logo(true)}</Link>
          <p className="max-w-sm font-heading text-3xl leading-tight font-medium text-white">
            {tienda ? (marca?.textos.eslogan ?? "Reservá, probátela, decidí. Nunca a ciegas.") : "Tiendas online con tu marca."}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-8 overflow-y-auto px-6 py-12 sm:px-12 lg:h-full lg:px-16">
        <Link to={ruta("/")} className="inline-block w-fit transition-opacity hover:opacity-90 lg:hidden">{logo(false)}</Link>
        <div className="mx-auto w-full max-w-sm">
          {/* Ruta de retorno visible (regla 1 del protocolo). */}
          <Link to={ruta("/")} className="mb-6 inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Volver a {tienda ? tienda.nombre : "Tiendaria"}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
