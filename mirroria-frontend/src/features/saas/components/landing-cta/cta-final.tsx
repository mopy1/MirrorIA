import { ArrowRight } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"

/** El ÚNICO bloque invertido de la página: índigo con el botón lima (misma etiqueta que el header). */
export function CtaFinal() {
  return (
    <section className="pb-20 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 rounded-2xl bg-primary px-6 py-12 text-primary-foreground sm:px-12 lg:grid-cols-[1fr_auto] lg:items-center lg:py-16">
          <h2 className="max-w-[22ch] text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Abrí tu tienda hoy. Los primeros 14 días corren por nuestra cuenta.
          </h2>
          <Link
            to="/registro-tienda"
            className={cn(buttonVariants({ size: "lg" }), "h-12 w-fit gap-2 bg-brand-accent px-6 text-base text-brand-accent-foreground hover:bg-brand-accent/90 active:translate-y-px")}
          >
            Crear mi tienda <ArrowRight weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  )
}
