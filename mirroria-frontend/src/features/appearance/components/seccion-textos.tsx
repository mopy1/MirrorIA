import { FieldGroup, FieldSeparator } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import type { MarcaPublica } from "@/types/marca.types"
import { opcional } from "../lib/borrador"
import { CampoTextoMarca } from "./campo-texto-marca"
import { CandadoPlan } from "./candado-plan"
import type { SeccionProps } from "./seccion-props"

type ClaveContacto = keyof MarcaPublica["contacto"]

const CONTACTO: { clave: ClaveContacto; label: string; max: number; prefijo?: string; placeholder: string }[] = [
  { clave: "instagram", label: "Instagram", max: 30, prefijo: "@", placeholder: "casaandina" },
  { clave: "facebook", label: "Facebook", max: 60, prefijo: "facebook.com/", placeholder: "casaandina" },
  { clave: "tiktok", label: "TikTok", max: 30, prefijo: "@", placeholder: "casaandina" },
  { clave: "whatsapp", label: "WhatsApp", max: 16, placeholder: "+59170012345" },
  { clave: "email", label: "Email de contacto", max: 120, placeholder: "hola@casaandina.bo" },
]

/** Pestaña Textos y contacto: eslogan, "sobre nosotras", redes e insignia (quitarla: plan Cadena). */
export function SeccionTextos({ editor, mi }: SeccionProps) {
  const { vista: v, errores: e, actualizar } = editor
  return (
    <FieldGroup>
      <CampoTextoMarca id="eslogan" label="Eslogan (opcional)" value={v.textos.eslogan} max={120} error={e["textos.eslogan"]} ayuda="Va bajo tu logo en el pie y en el directorio de MirrorIA." onChange={(s) => actualizar((b) => ({ ...b, textos: { ...b.textos, eslogan: opcional(s) } }))} />
      <CampoTextoMarca id="sobre" label="Sobre nosotras (opcional)" multilinea value={v.textos.sobreNosotros} max={600} error={e["textos.sobreNosotros"]} onChange={(s) => actualizar((b) => ({ ...b, textos: { ...b.textos, sobreNosotros: opcional(s) } }))} />
      <FieldSeparator>Redes y contacto</FieldSeparator>
      <div className="grid gap-5 sm:grid-cols-2">
        {CONTACTO.map((c) => (
          <CampoTextoMarca key={c.clave} id={`contacto-${c.clave}`} label={c.label} prefijo={c.prefijo} placeholder={c.placeholder} max={c.max} value={v.contacto[c.clave]} error={e[`contacto.${c.clave}`]} onChange={(s) => actualizar((b) => ({ ...b, contacto: { ...b.contacto, [c.clave]: opcional(s.replace(/^@/, "")) } }))} />
        ))}
      </div>
      <CandadoPlan titulo="Marca blanca" nivel="MARCA_BLANCA" bloqueado={!mi.permitido.quitarInsignia}>
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <span>
            <span className="block text-sm font-medium">Mostrar "Hecho con MirrorIA"</span>
            <span className="block text-xs text-muted-foreground">La insignia del pie de tu tienda.</span>
          </span>
          <Switch checked={v.mostrarInsignia} onCheckedChange={(mostrarInsignia) => actualizar((b) => ({ ...b, mostrarInsignia }))} />
        </label>
      </CandadoPlan>
    </FieldGroup>
  )
}
