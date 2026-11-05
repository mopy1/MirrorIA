import { MagicWand, Warning } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

/** Aviso inline ámbar con el ratio medido y el arreglo automático (CU34 3b). */
export function AvisoContraste({ mensaje, onAjustar }: { mensaje: string; onAjustar: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 sm:flex-row sm:items-center sm:justify-between dark:text-amber-300">
      <span className="flex items-start gap-2">
        <Warning weight="fill" className="mt-0.5 size-4 shrink-0" />
        {mensaje}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={onAjustar} className="shrink-0 gap-1.5 bg-background">
        <MagicWand /> Ajustar contraste
      </Button>
    </div>
  )
}
