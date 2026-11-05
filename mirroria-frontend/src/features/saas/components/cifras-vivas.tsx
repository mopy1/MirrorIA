import { useEstadisticas } from "../hooks/useEstadisticas"

/** Franja de cifras REALES (`GET /saas/estadisticas`). Si alguna es 0 o falla, no se muestra (nunca "0 tiendas"). */
export function CifrasVivas() {
  const { data } = useEstadisticas()
  if (!data || data.tiendasAbiertas === 0 || data.prendasPublicadas === 0 || data.ciudades === 0) return null
  const cifras = [
    { n: data.tiendasAbiertas, t: data.tiendasAbiertas === 1 ? "tienda abierta" : "tiendas abiertas" },
    { n: data.prendasPublicadas, t: data.prendasPublicadas === 1 ? "prenda publicada" : "prendas publicadas" },
    { n: data.ciudades, t: data.ciudades === 1 ? "ciudad" : "ciudades" },
  ]
  return (
    <section className="border-y border-border/60">
      <dl className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-border/60 px-4 sm:px-6">
        {cifras.map((c) => (
          <div key={c.t} className="px-2 py-6 text-center sm:py-8">
            <dt className="sr-only">{c.t}</dt>
            <dd className="font-heading text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{c.n.toLocaleString("es-BO")}</dd>
            <dd className="mt-1 text-sm text-muted-foreground">{c.t}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
