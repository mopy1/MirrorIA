import { MapPin, Phone } from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSucursales } from "@/features/branches/hooks/useSucursales"
import { cn } from "cn"

/** Contacto real: no hay email/redes del equipo cargados en ningún lado del
 * sistema, así que "contactanos" es, honestamente, llamar o visitar una
 * sucursal — mismos datos reales que ya muestra `/sucursales`, no un
 * formulario o canal inventado. `id="contacto"` es el ancla que usa el
 * footer (`site-footer.data.ts`). */
export function ContactSection() {
  const reduce = useReducedMotion()
  const { sucursales, isLoading } = useSucursales()

  return (
    <section id="contacto" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="max-w-[24ch] text-3xl font-semibold tracking-tight sm:text-4xl">
          ¿Tenés dudas? Llamanos o visitanos.
        </h2>
        <Link to="/sucursales" className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>
          Ver todas las sucursales
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </>
        ) : (
          sucursales.map((sucursal, index) => (
            <motion.div
              key={sucursal.id}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="rounded-2xl bg-secondary p-6"
            >
              <p className="font-medium">{sucursal.nombre}</p>
              <p className="text-sm text-muted-foreground">{sucursal.ciudadNombre}</p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-start gap-2 text-foreground/90">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" weight="light" />
                  <span>{sucursal.direccion}</span>
                </div>
                {sucursal.telefono && (
                  <a
                    href={`tel:${sucursal.telefono}`}
                    className="flex items-center gap-2 text-foreground/90 transition-colors hover:text-primary"
                  >
                    <Phone className="size-4 shrink-0 text-primary" weight="light" />
                    <span>{sucursal.telefono}</span>
                  </a>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  )
}
