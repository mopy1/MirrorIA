import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"
import { ImagenMarca } from "@/components/marca/imagen-marca"
import { buttonVariants } from "@/components/ui/button"
import { useMarca } from "@/hooks/useMarca"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { DESTINOS } from "@/lib/tema/marca.constants"
import { cn } from "cn"
import { HERO_CONTENT } from "./hero-section.data"

/**
 * Portada de la tienda con SU marca (spec Fase 1b §E.5): imagen, título,
 * subtítulo y botón vienen de `marca.hero`; sin marca, los textos de respaldo.
 * Altura acotada a la ventana; en móvil la foto va de fondo con degradado
 * vertical y en desktop el texto descansa a la izquierda sobre negro.
 */
export function HeroSection() {
  const ruta = useRutaTienda()
  const reduce = useReducedMotion()
  const hero = useMarca()?.hero
  const titulo = hero?.titulo ?? HERO_CONTENT.headline
  const subtitulo = hero ? hero.subtitulo : HERO_CONTENT.subtext
  const primario = hero
    ? { label: hero.ctaTexto, href: DESTINOS[hero.ctaDestino]?.ruta ?? "/tienda" }
    : HERO_CONTENT.primaryCta
  const conProbador = hero ? hero.mostrarProbador : true

  return (
    <section className="relative h-[calc(100svh-4rem)] max-h-[880px] min-h-[560px] overflow-hidden bg-black">
      <ImagenMarca
        src={hero?.imagenUrl ?? "/images/hero-model.webp"}
        alt=""
        prioritaria
        className="absolute inset-0 h-full w-full object-cover object-[45%_18%] lg:object-[48%_38%]"
        respaldo={<img src="/images/hero-model.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[45%_18%]" />}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent lg:hidden" />
      <div className="pointer-events-none absolute inset-0 z-10 hidden bg-gradient-to-r from-black via-black/60 to-transparent lg:block" />

      <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-8 sm:px-6 sm:pb-12 lg:justify-center lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl"
        >
          <h1 className="text-3xl leading-[1.1] font-semibold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl xl:text-6xl">
            {titulo}
          </h1>
          {subtitulo && <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-white/80 sm:mt-6 sm:text-base">{subtitulo}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <Link to={ruta(primario.href)} className={cn(buttonVariants({ size: "lg" }))}>
              {primario.label}
            </Link>
            {conProbador && (
              <Link
                to={ruta(HERO_CONTENT.secondaryCta.href)}
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/40 bg-transparent text-white hover:bg-white/10")}
              >
                {HERO_CONTENT.secondaryCta.label}
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
