import { useEffect, useMemo, type CSSProperties } from "react"
import { derivarTokens } from "@/lib/tema/derivar-tokens"
import { precargarFuente } from "@/lib/tema/fuentes"
import type { MarcaPublica } from "@/types/marca.types"
import { cn } from "cn"
import { MarcoDispositivo } from "./marco-dispositivo"
import { PreviewFooter } from "./preview-footer"
import { PreviewHeader } from "./preview-header"
import { PreviewHero } from "./preview-hero"
import { PreviewProductos } from "./preview-productos"
import type { Dispositivo, ProductoMini } from "./tipos"

interface Props {
  marca: MarcaPublica
  nombre: string
  productos?: ProductoMini[]
  dispositivo: Dispositivo
  className?: string
}

/**
 * Mini tienda con una marca (borrador o guardada). El tema se aplica en SU
 * contenedor, no en <html>: `data-tema="tienda"` + `.dark` + variables inline.
 * No usa portales ni variantes `dark:` (en la landing oscura se colarían).
 * La usan /admin/apariencia, el alta, la landing y el detalle de plataforma.
 */
export function VistaPreviaTienda({ marca, nombre, productos, dispositivo, className }: Props) {
  const estilo = useMemo(() => derivarTokens(marca, "tienda") as CSSProperties, [marca])
  useEffect(() => precargarFuente(marca.fuente), [marca.fuente])
  const celular = dispositivo === "celular"
  const props = { marca, nombre, celular }

  return (
    <MarcoDispositivo dispositivo={dispositivo} className={className}>
      <div data-tema="tienda" className={cn("min-h-full bg-background font-sans text-foreground", marca.modo === "OSCURO" && "dark")} style={estilo}>
        <PreviewHeader {...props} />
        <PreviewHero {...props} />
        <PreviewProductos productos={productos} celular={celular} />
        <PreviewFooter {...props} />
      </div>
    </MarcoDispositivo>
  )
}
