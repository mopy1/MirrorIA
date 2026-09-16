import { motion, useReducedMotion } from "motion/react"
import { unsplashUrl } from "@/lib/unsplash"
import { FEATURE_HIGHLIGHTS } from "./feature-highlights.data"

export function FeatureHighlights() {
  const reduce = useReducedMotion()
  const [primary, ...rest] = FEATURE_HIGHLIGHTS

  return (
    <section id="vestidor" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <h2 className="max-w-[24ch] text-3xl font-semibold tracking-tight sm:text-4xl">
        Comprar ropa online, sin la incertidumbre.
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
        <motion.article
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-2xl lg:col-span-2 lg:row-span-2"
        >
          <img
            src={unsplashUrl(primary.imageId!, 1200, 900)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="relative p-8 text-white">
            <primary.icon className="size-7" weight="light" />
            <p className="mt-4 text-xl font-medium">{primary.title}</p>
            <p className="mt-2 max-w-[38ch] text-sm text-white/80">{primary.body}</p>
          </div>
        </motion.article>

        {rest.map((feature, index) => (
          <motion.article
            key={feature.title}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
            className="flex flex-col justify-center rounded-2xl bg-secondary p-8"
          >
            <feature.icon className="size-7 text-primary" weight="light" />
            <p className="mt-4 text-lg font-medium">{feature.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
