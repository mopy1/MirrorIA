import { ArrowsClockwise } from "@phosphor-icons/react"
import { AyudaTermino } from "@/components/common/ayuda-termino"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { armarCifras, type DatosCifras } from "../../lib/inicio-cifras"

interface CifrasInicioProps {
  datos: DatosCifras
  onReintentar: () => void
}

/** Franja de 4 cifras, cada una con su frase de contexto. Una sola superficie
 * dividida por líneas finas, no 4 tarjetas iguales. */
export function CifrasInicio({ datos, onReintentar }: CifrasInicioProps) {
  const cifras = armarCifras(datos)
  const algunaFallo = Object.values(datos).some((d) => d === null)

  return (
    <section aria-labelledby="titulo-cifras" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="titulo-cifras" className="text-base font-semibold">Tu tienda en números</h2>
        <p className="text-xs text-muted-foreground">Todo lo registrado desde que abriste, hasta hoy</p>
      </div>
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border @md:grid-cols-2 @2xl:grid-cols-4">
        {cifras.map((c) => (
          <div key={c.id} className="min-w-0 space-y-1 bg-card p-4">
            <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {c.nombre}
              {c.ayuda && <AyudaTermino titulo={c.nombre}>{c.ayuda}</AyudaTermino>}
            </dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">
              {c.cargando ? <Skeleton className="h-8 w-28" /> : (c.valor ?? "—")}
            </dd>
            <dd className="text-xs text-muted-foreground">
              {c.cargando ? <Skeleton className="h-4 w-36" /> : c.contexto}
            </dd>
          </div>
        ))}
      </dl>
      {algunaFallo && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onReintentar}>
          <ArrowsClockwise className="size-3.5" />
          Volver a cargar las cifras
        </Button>
      )}
    </section>
  )
}
