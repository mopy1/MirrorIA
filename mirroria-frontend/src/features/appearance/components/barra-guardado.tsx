import { CircleNotch, FloppyDisk } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

interface Props {
  visible: boolean
  guardando: boolean
  valido: boolean
  onDescartar: () => void
  onGuardar: () => void
}

/** Barra fija abajo solo con cambios: Descartar (ghost) y el ÚNICO primario de la vista, Guardar cambios. */
export function BarraGuardado({ visible, guardando, valido, onDescartar, onGuardar }: Props) {
  if (!visible) return null
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-medium">Tenés cambios sin guardar.</span>{" "}
          {!valido && <span className="text-destructive">Corregí lo marcado para poder guardar.</span>}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onDescartar} disabled={guardando}>Descartar</Button>
          <Button type="button" onClick={onGuardar} disabled={guardando || !valido} className="gap-2">
            {guardando ? <CircleNotch className="size-4 animate-spin" /> : <FloppyDisk />}
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  )
}
