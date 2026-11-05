import { useState } from "react"
import { DesktopTower, DeviceMobile, Eye } from "@phosphor-icons/react"
import { VistaPreviaTienda, type Dispositivo, type ProductoMini } from "@/components/marca/vista-previa"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { MarcaPublica } from "@/types/marca.types"

interface Props {
  marca: MarcaPublica
  nombre: string
  productos: ProductoMini[]
  /** Hay cambios sin guardar (la vista previa muestra el borrador, no lo publicado). */
  sucio: boolean
}

function Selector({ valor, onCambiar }: { valor: Dispositivo; onCambiar: (d: Dispositivo) => void }) {
  return (
    <ToggleGroup variant="outline" size="sm" value={[valor]} onValueChange={(v) => v[0] && onCambiar(v[0] as Dispositivo)} aria-label="Dispositivo de la vista previa">
      <ToggleGroupItem value="escritorio" className="gap-1.5"><DesktopTower /> Escritorio</ToggleGroupItem>
      <ToggleGroupItem value="celular" className="gap-1.5"><DeviceMobile /> Celular</ToggleGroupItem>
    </ToggleGroup>
  )
}

/** Vista previa EN VIVO del borrador: sticky al costado en desktop, en un Sheet de abajo en móvil. */
export function PanelVistaPrevia({ marca, nombre, productos, sucio }: Props) {
  const [dispositivo, setDispositivo] = useState<Dispositivo>("escritorio")
  const [abierta, setAbierta] = useState(false)
  const contenido = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">Vista previa <span className="font-normal text-muted-foreground">{sucio ? "· sin guardar todavía" : "· así la ven tus clientas"}</span></p>
        <Selector valor={dispositivo} onCambiar={setDispositivo} />
      </div>
      <VistaPreviaTienda marca={marca} nombre={nombre} productos={productos} dispositivo={dispositivo} className="mt-4" />
    </>
  )
  return (
    <>
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">{contenido}</aside>
      <Button type="button" variant="outline" className="gap-1.5 lg:hidden" onClick={() => setAbierta(true)}>
        <Eye /> Ver vista previa
      </Button>
      <Sheet open={abierta} onOpenChange={setAbierta}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto p-4">
          <SheetHeader className="p-0">
            <SheetTitle>Así se ve tu tienda</SheetTitle>
          </SheetHeader>
          {contenido}
        </SheetContent>
      </Sheet>
    </>
  )
}
