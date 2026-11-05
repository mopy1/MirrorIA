import { Check } from "@phosphor-icons/react"
import { GALERIA, GRUPOS_GALERIA, type GrupoGaleria } from "@/components/marca/galeria-imagenes.data"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "cn"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Grupo que se muestra primero (el resto queda debajo). */
  grupo: GrupoGaleria
  actual: string | null
  onElegir: (url: string) => void
}

/** Fotos curadas y verificadas: la dueña elige una sin tener que buscar un enlace. */
export function GaleriaDialog({ open, onOpenChange, grupo, actual, onElegir }: Props) {
  const orden = [grupo, ...GRUPOS_GALERIA.filter((g) => g !== grupo)]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Elegí una imagen</DialogTitle>
          <DialogDescription>Fotos de uso libre. Podés cambiarla cuando quieras.</DialogDescription>
        </DialogHeader>
        {orden.map((g) => (
          <section key={g} className="space-y-2">
            <h3 className="text-sm font-medium">{g}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {GALERIA.filter((i) => i.grupo === g).map((img) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => { onElegir(img.url); onOpenChange(false) }}
                  className={cn(
                    "group relative aspect-[4/3] overflow-hidden rounded-lg border outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    actual === img.url ? "border-primary ring-2 ring-primary/40" : "border-border",
                  )}
                >
                  <img src={img.url} alt={img.descripcion} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  {actual === img.url && (
                    <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check weight="bold" className="size-3.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </DialogContent>
    </Dialog>
  )
}
