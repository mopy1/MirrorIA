import { ArrowRight, CheckCircle, QrCode, Sparkle } from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { SLUG_DEMO } from "@/lib/rutas-tienda"
import { cn } from "cn"

const DATOS = [
  { valor: "14 días", texto: "de prueba gratis" },
  { valor: "Bs 99", texto: "plan inicial por mes" },
  { valor: "5 min", texto: "para tener tu tienda" },
]

export function HeroSaas() {
  const reduce = useReducedMotion()
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary">
            <Sparkle weight="fill" /> Plataforma para tiendas de moda
          </Badge>
          <h1 className="mt-5 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl xl:text-6xl">
            Tu tienda de moda con vestidor virtual, lista hoy.
          </h1>
          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
            MirrorIA te da la tienda online, el probador con IA, las reservas en sucursal y el cobro por QR. Elegís un
            plan, ponés el nombre de tu marca y empezás a vender.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/registro-tienda" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Crear mi tienda <ArrowRight weight="bold" />
            </Link>
            <Link to={`/t/${SLUG_DEMO}`} className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Ver la tienda demo
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {DATOS.map((d) => (
              <div key={d.texto}>
                <dt className="text-2xl font-semibold tracking-tight text-foreground">{d.valor}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{d.texto}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="relative h-[460px] overflow-hidden rounded-3xl border border-border/60 shadow-xl shadow-primary/10">
            <img src="/images/hero-model.webp" alt="Clienta probándose una prenda en el vestidor virtual" className="absolute inset-0 h-full w-full object-cover object-[45%_25%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-5 text-sm font-medium text-white">boutique-lila · tienda en vivo</p>
          </div>
          <div className="absolute -left-6 top-10 flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs shadow-lg">
            <Sparkle className="size-4 text-primary" weight="fill" /> Vestidor IA: probándose “Vestido Aurora”
          </div>
          <div className="absolute -right-4 bottom-16 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-card px-3 py-2 text-xs shadow-lg">
            <QrCode className="size-4 text-emerald-600 dark:text-emerald-400" /> Pago QR acreditado · Bs 289,00
            <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" weight="fill" />
          </div>
        </div>
      </div>
    </section>
  )
}
