import { ArrowRight } from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import type { TiendaPublica } from "@/types/tienda.types"
import { cn } from "cn"
import { AbanicoMarcas } from "./abanico-marcas"

/** Hero de Tiendaria: split asimétrico, 1 primario + 1 secundario, sin eyebrow ni cifras (spec §E.3-2). */
export function HeroSaas({ tiendas }: { tiendas: TiendaPublica[] }) {
  const reduce = useReducedMotion()
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16 lg:pb-20">
        <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="max-w-[16ch] text-4xl leading-[1.04] font-bold tracking-tight text-balance md:text-5xl lg:text-6xl">
            Tu tienda de moda online,{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span aria-hidden className="absolute inset-x-[-0.12em] bottom-[0.06em] h-[0.42em] -skew-x-6 rounded-sm bg-brand-accent dark:bg-primary/35" />
              <span className="relative">con tu marca.</span>
            </span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
            Catálogo, reservas en sucursal, cobro por QR y probador con IA. Vos elegís los colores, el logo y las fotos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/registro-tienda" className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 px-5 active:translate-y-px")}>
              Crear mi tienda <ArrowRight weight="bold" />
            </Link>
            <Link to="/#tiendas" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 px-5")}>
              Ver tiendas
            </Link>
          </div>
        </motion.div>
        <AbanicoMarcas tiendas={tiendas} />
      </div>
    </section>
  )
}
