import { useState } from "react"
import { ArrowCounterClockwise, CaretDown, CircleNotch } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { SeccionMarca } from "@/types/marca.types"

const SECCIONES: { valor: SeccionMarca; label: string; detalle: string }[] = [
  { valor: "MARCA", label: "Logo y favicon", detalle: "Se quitan el logo y el favicon." },
  { valor: "COLORES", label: "Colores y estilo", detalle: "Vuelven los colores de tu paleta inicial, modo claro, bordes suaves y fuente Moderna." },
  { valor: "PORTADA", label: "Portada", detalle: "Vuelven la imagen y los textos iniciales de la portada." },
  { valor: "IMAGENES", label: "Imágenes", detalle: "Se quitan las imágenes de las secciones." },
  { valor: "TEXTOS", label: "Textos y contacto", detalle: "Se borran eslogan, sobre nosotras, redes y contacto." },
]
const TODO = { valor: "TODO" as const, label: "Todo", detalle: "Toda la apariencia vuelve a como estaba al crear la tienda. El nombre no cambia." }

/** Restablecer por sección o todo, siempre con confirmación (CU36). */
export function RestablecerMenu({ enCurso, onConfirmar }: { enCurso: boolean; onConfirmar: (s: SeccionMarca) => Promise<boolean> }) {
  const [elegida, setElegida] = useState<(typeof SECCIONES)[number] | typeof TODO | null>(null)
  async function confirmar() {
    if (elegida && (await onConfirmar(elegida.valor))) setElegida(null)
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="gap-1.5"><ArrowCounterClockwise /> Restablecer <CaretDown className="size-3.5" /></Button>} />
        <DropdownMenuContent align="end" className="w-56">
          {SECCIONES.map((s) => <DropdownMenuItem key={s.valor} onClick={() => setElegida(s)}>{s.label}</DropdownMenuItem>)}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setElegida(TODO)}>Todo</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={elegida !== null} onOpenChange={(o) => !o && setElegida(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Restablecer {elegida?.label.toLowerCase()}?</DialogTitle>
            <DialogDescription>{elegida?.detalle} Se guarda en el momento.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setElegida(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmar} disabled={enCurso} className="gap-2">
              {enCurso && <CircleNotch className="size-4 animate-spin" />} Restablecer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
