import { ImageSquare, Palette, Storefront, TextAa, Panorama, type Icon } from "@phosphor-icons/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PestanaApariencia } from "../types/apariencia.types"
import { SeccionColores } from "./seccion-colores"
import { SeccionImagenes } from "./seccion-imagenes"
import { SeccionMarca } from "./seccion-marca"
import { SeccionPortada } from "./seccion-portada"
import type { SeccionProps } from "./seccion-props"
import { SeccionTextos } from "./seccion-textos"

const PESTANAS: { valor: PestanaApariencia; label: string; icono: Icon; Seccion: (p: SeccionProps) => React.ReactNode }[] = [
  { valor: "marca", label: "Marca", icono: Storefront, Seccion: SeccionMarca },
  { valor: "colores", label: "Colores y estilo", icono: Palette, Seccion: SeccionColores },
  { valor: "portada", label: "Portada", icono: Panorama, Seccion: SeccionPortada },
  { valor: "imagenes", label: "Imágenes", icono: ImageSquare, Seccion: SeccionImagenes },
  { valor: "textos", label: "Textos y contacto", icono: TextAa, Seccion: SeccionTextos },
]

/**
 * Las 5 pestañas del editor (a todo el ancho) y, debajo, el formulario de la
 * pestaña activa al lado de la vista previa (`vistaPrevia`, sticky).
 */
export function AparienciaTabs({ vistaPrevia, ...props }: SeccionProps & { vistaPrevia: React.ReactNode }) {
  return (
    <Tabs defaultValue="marca" className="gap-6">
      <div className="-mx-1 overflow-x-auto border-b border-border/60 px-1">
        <TabsList variant="line" className="h-10">
          {PESTANAS.map((p) => (
            <TabsTrigger key={p.valor} value={p.valor} className="gap-1.5 px-3">
              <p.icono /> {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="min-w-0">
          {PESTANAS.map(({ valor, Seccion }) => (
            <TabsContent key={valor} value={valor} className="max-w-xl">
              <Seccion {...props} />
            </TabsContent>
          ))}
        </div>
        <div className="hidden lg:block">{vistaPrevia}</div>
      </div>
    </Tabs>
  )
}
