import { Skeleton } from "@/components/ui/skeleton"

/** Lo que se ve mientras baja el chunk de una página diferida (ver
 * routes/lazy-pages.ts): un esqueleto chico, no una pantalla en blanco. */
export function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6" aria-busy="true" aria-label="Cargando página">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
