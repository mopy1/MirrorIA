import { Badge } from "@/components/ui/badge"
import { PASARELAS, type PasarelaSuscripcion } from "./pasarelas-suscripcion.data"

/** Lista de pasarelas (cascarón de la Fase 2: la Fase 2 solo cambia `disponible` y el onClick). */
export function PasarelasSuscripcion({ pasarelas = PASARELAS }: { pasarelas?: PasarelaSuscripcion[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Elegí cómo pagar</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border/60 bg-card">
        {pasarelas.map((p) => (
          <li key={p.codigo}>
            <button type="button" disabled={!p.disponible} className="flex w-full items-center gap-4 p-4 text-left transition-colors enabled:hover:bg-muted/50 disabled:cursor-not-allowed">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <p.icono className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{p.nombre}</span>
                <span className="block text-sm text-muted-foreground">{p.detalle}</span>
              </span>
              {!p.disponible && (
                <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">Próximamente</Badge>
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">Mientras tanto, tu prueba sigue activa.</p>
    </section>
  )
}
