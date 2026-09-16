import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { useSucursales } from "@/features/branches/hooks/useSucursales"
import { unsplashUrl } from "@/lib/unsplash"

export function BranchesStrip() {
  const reduce = useReducedMotion()
  const { sucursales } = useSucursales()
  const ciudades = [...new Set(sucursales.map((s) => s.ciudadNombre))]

  return (
    <section id="sucursales" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <Link to="/sucursales" className="block">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="relative flex min-h-80 flex-col justify-end overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <img
            src={unsplashUrl("1761090617068-f1b3257d27ad", 1600, 700)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />

          <div className="relative flex flex-col gap-6 p-8 sm:p-12">
            <p className="max-w-md text-2xl leading-tight font-medium text-white sm:text-3xl">
              Probátela en persona en nuestras sucursales
            </p>
            {ciudades.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ciudades.map((ciudad) => (
                  <Badge
                    key={ciudad}
                    variant="outline"
                    className="border-white/30 bg-white/10 px-3 py-1 text-sm text-white backdrop-blur-sm"
                  >
                    {ciudad}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </Link>
    </section>
  )
}
