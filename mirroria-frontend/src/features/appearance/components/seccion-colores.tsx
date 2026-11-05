import { SelectorPaleta } from "@/components/marca/selector-paleta"
import { FieldGroup } from "@/components/ui/field"
import { ajustarContraste } from "@/lib/tema/color"
import { CODIGOS_PALETA, PALETAS } from "@/lib/tema/marca.constants"
import { errorContraste } from "../lib/validar-marca"
import { AvisoContraste } from "./aviso-contraste"
import { CampoColor } from "./campo-color"
import { SeccionEstilo } from "./seccion-estilo"
import type { SeccionProps } from "./seccion-props"

/** Pestaña Colores y estilo: paletas, principal + acento (con contraste vigilado) y estilo según plan. */
export function SeccionColores({ editor, mi }: SeccionProps) {
  const { vista: v, actualizar } = editor
  const paleta = CODIGOS_PALETA.find((c) => PALETAS[c].primario === v.colorPrimario && PALETAS[c].acento === v.colorAcento) ?? null
  const aviso = errorContraste(v.colorPrimario, v.modo)

  return (
    <FieldGroup>
      <section className="space-y-3">
        <h3 className="text-sm font-medium">Paletas sugeridas</h3>
        <SelectorPaleta
          valor={paleta}
          onCambiar={(c) => actualizar((b) => ({ ...b, colorPrimario: PALETAS[c].primario, colorAcento: PALETAS[c].acento }))}
        />
      </section>
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoColor id="color-principal" label="Color principal" value={v.colorPrimario} ayuda="Botones, enlaces y cabecera activa." onChange={(colorPrimario) => actualizar((b) => ({ ...b, colorPrimario }))} />
        <CampoColor id="color-acento" label="Color de acento" value={v.colorAcento} ayuda="Etiquetas como Nuevo, el carrito y detalles." onChange={(colorAcento) => actualizar((b) => ({ ...b, colorAcento }))} />
      </div>
      {aviso && (
        <AvisoContraste mensaje={aviso} onAjustar={() => actualizar((b) => ({ ...b, colorPrimario: ajustarContraste(v.colorPrimario, v.modo) }))} />
      )}
      <SeccionEstilo editor={editor} mi={mi} />
    </FieldGroup>
  )
}
