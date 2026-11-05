import { ArrowRight } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export function CtaFinal() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground shadow-xl shadow-primary/20">
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary-foreground/10 blur-2xl" />
          <h2 className="relative text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Abrí tu tienda hoy y probala 14 días gratis.
          </h2>
          <p className="relative mx-auto mt-3 max-w-[48ch] text-sm text-primary-foreground/80">
            Sin tarjeta para empezar. Cambiás de plan cuando quieras durante la prueba.
          </p>
          <Link
            to="/registro-tienda"
            className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "relative mt-8 gap-2")}
          >
            Crear mi tienda <ArrowRight weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  )
}
