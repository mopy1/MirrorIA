import { useState } from "react"
import { Check, Copy, Storefront } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/** Skeleton con la forma real del Resumen. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      <Skeleton className="h-20 rounded-xl" />
      <div className="grid gap-8 lg:grid-cols-2"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
      <div className="grid gap-8 lg:grid-cols-2"><Skeleton className="h-56 rounded-xl" /><Skeleton className="h-56 rounded-xl" /></div>
    </div>
  )
}

/** Sin tiendas: el siguiente paso es compartir el enlace de registro. */
export function DashboardVacio() {
  const [copiado, setCopiado] = useState(false)
  const enlace = `${window.location.origin}/registro-tienda`
  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
      <Storefront className="size-10 text-primary" weight="light" />
      <p className="font-medium">Todavía no hay tiendas. Compartí el enlace de registro.</p>
      <p className="font-mono text-sm text-muted-foreground">{enlace}</p>
      <Button onClick={copiar} className="gap-1.5">{copiado ? <Check /> : <Copy />} {copiado ? "Enlace copiado" : "Copiar enlace"}</Button>
    </div>
  )
}
