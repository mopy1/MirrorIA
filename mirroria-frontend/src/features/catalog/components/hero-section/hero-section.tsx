import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { HERO_CONTENT } from "./hero-section.data"

/**
 * Hero editorial adaptativo:
 * - Altura: `h-[calc(100svh-4rem)]` con límites `min-h-[560px]` y `max-h-[880px]`.
 *   Se ajusta dinámicamente a la pantalla del usuario (desktop, laptop, tablet o mobile)
 *   sin dejar huecos ni desbordar la ventana.
 * - Mobile (<1024px): Foto como fondo full-bleed con encuadre en la mitad superior
 *   (`object-[45%_18%]`), asegurando que el rostro y la mirada de la modelo queden
 *   completamente visibles y libres de cortes, mientras el texto y botones reposan
 *   abajo con un degradado vertical que garantiza alto contraste y legibilidad.
 * - Desktop (>=1024px): Layout editorial asimétrico. La imagen ocupa el lateral derecho (58%)
 *   con degradado horizontal que se funde limpiamente con el fondo negro a la izquierda.
 *   El bloque de texto se ubica a la izquierda sobre fondo oscuro puro, evitando que el texto
 *   colisione o tape el rostro de la modelo.
 */
export function HeroSection() {
  const reduce = useReducedMotion()
  const { headline, subtext, primaryCta, secondaryCta } = HERO_CONTENT

  return (
    <section className="relative h-[calc(100svh-4rem)] min-h-[560px] max-h-[880px] overflow-hidden bg-black">
      {/* Contenedor de la foto: full-width, carga local instantánea */}
      <div className="absolute inset-0 h-full w-full">
        <img
          src="/images/hero-model.jpg"
          alt="Clienta probándose una prenda frente al vestidor virtual"
          className="h-full w-full object-cover object-[45%_18%] lg:object-[48%_38%]"
        />
      </div>

      {/* Degradado vertical en mobile (oscurece solo la parte inferior para texto/botones) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent lg:hidden" />

      {/* Difuminado horizontal en desktop (oscurece lateral izquierdo para texto, deja la modelo brillante a la derecha) */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black via-black/60 to-transparent lg:block z-10" />

      {/* Contenido textual y llamadas a la acción */}
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-8 sm:px-6 sm:pb-12 lg:justify-center lg:px-8 z-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.1]">
            {headline}
          </h1>
          <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-white/80 sm:mt-6 sm:text-base">
            {subtext}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <Link to={primaryCta.href} className={cn(buttonVariants({ size: "lg" }))}>
              {primaryCta.label}
            </Link>
            <a
              href={secondaryCta.href}
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/40 bg-transparent text-white hover:bg-white/10"
              )}
            >
              {secondaryCta.label}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

