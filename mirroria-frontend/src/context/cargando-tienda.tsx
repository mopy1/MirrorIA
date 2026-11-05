import { Skeleton } from "@/components/ui/skeleton"

/** Skeleton de `/t/:slug` mientras se resuelve: solo neutros (nunca `--primary`, así no se ve índigo). */
export function CargandoTienda() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 border-b border-border/60 px-4 sm:px-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="ml-auto h-8 w-48" />
      </div>
      <Skeleton className="mx-auto mt-8 h-[60vh] w-full max-w-7xl rounded-2xl" />
    </div>
  )
}
