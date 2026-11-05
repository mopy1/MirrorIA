import { motion, useReducedMotion } from "motion/react"
import { cn } from "cn"
import { CELDAS, type CeldaBento } from "./incluye-bento.data"

function Celda({ c }: { c: CeldaBento }) {
  if (c.imagen) {
    return (
      <>
        <img src={c.imagen} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="relative mt-auto p-6 text-white">
          <c.icono className="size-6" />
          <h3 className="mt-3 text-xl font-semibold">{c.titulo}</h3>
          <p className="mt-1 max-w-[40ch] text-sm text-white/80">{c.texto}</p>
        </div>
      </>
    )
  }
  return (
    <div className="p-6">
      <c.icono className="size-6 text-primary dark:text-foreground" />
      <h3 className="mt-3 text-lg font-semibold">{c.titulo}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{c.texto}</p>
    </div>
  )
}

/** Bento de 5 celdas con ritmo (3+3 / 3, 2+4): 2 con foto real y 3 con tintes del tema. */
export function IncluyeBento() {
  const reduce = useReducedMotion()
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="max-w-[20ch] text-3xl font-bold tracking-tight text-balance sm:text-4xl">Todo lo que una boutique necesita para vender online.</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-6">
          {CELDAS.map((c, i) => (
            <motion.article
              key={c.titulo}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-2xl",
                c.tinte === "primario" && "bg-primary/[0.06] dark:bg-primary/10",
                c.tinte === "acento" && "bg-brand-accent/35 dark:bg-brand-accent/15",
                c.clase,
              )}
            >
              <Celda c={c} />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
