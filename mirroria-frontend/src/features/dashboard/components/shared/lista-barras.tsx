import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export interface FilaBarra {
  id: string
  nombre: string
  detalle?: ReactNode
  valor: string
  /** 0-1 respecto del mayor de la lista. */
  proporcion: number
  imagenUrl?: string | null
}

/** Ranking legible: nombre completo, valor y barra proporcional (sin ejes ni etiquetas truncadas). */
export function ListaBarras({ filas, conImagen }: { filas: FilaBarra[]; conImagen?: boolean }) {
  return (
    <ol className="flex flex-col gap-3.5">
      {filas.map((f) => (
        <li key={f.id} className="flex items-center gap-3">
          {conImagen && <Miniatura url={f.imagenUrl} nombre={f.nombre} />}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 text-sm font-medium text-foreground break-words">{f.nombre}</p>
              <p className="shrink-0 text-sm font-semibold text-foreground tabular-nums">{f.valor}</p>
            </div>
            {f.detalle && <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{f.detalle}</p>}
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted" aria-hidden>
              <div className="h-full rounded-full bg-primary/80" style={{ width: `${Math.max(f.proporcion * 100, 2)}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Miniatura({ url, nombre }: { url?: string | null; nombre: string }) {
  if (!url) {
    return (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground" aria-hidden>
        {nombre.charAt(0).toUpperCase()}
      </div>
    )
  }
  return <img src={url} alt="" loading="lazy" className="size-11 shrink-0 rounded-md bg-muted object-cover" />
}

export function ListaBarrasSkeleton({ filas = 4, conImagen }: { filas?: number; conImagen?: boolean }) {
  return (
    <div className="flex flex-col gap-3.5" aria-busy="true">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          {conImagen && <Skeleton className="size-11 shrink-0 rounded-md" />}
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-1.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
