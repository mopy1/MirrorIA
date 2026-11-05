import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DESTINOS } from "@/lib/tema/marca.constants"
import type { DestinoCta, HeroMarca } from "@/types/marca.types"
import { opcional } from "../lib/borrador"
import { CampoImagen } from "./campo-imagen"
import { CampoTextoMarca } from "./campo-texto-marca"
import type { SeccionProps } from "./seccion-props"

/** Pestaña Portada: imagen, textos y botón del hero de la tienda. */
export function SeccionPortada({ editor }: SeccionProps) {
  const { vista: v, errores: e, actualizar } = editor
  const set = (cambio: Partial<HeroMarca>) => actualizar((b) => ({ ...b, hero: { ...b.hero, ...cambio } }))
  return (
    <FieldGroup>
      <CampoImagen id="hero-imagen" label="Imagen de portada" grupo="Portada" obligatoria value={v.hero.imagenUrl} error={e["hero.imagenUrl"]} ayuda="Horizontal y con la persona hacia la derecha: el texto va a la izquierda." onChange={(url) => url && set({ imagenUrl: url })} />
      <CampoTextoMarca id="hero-titulo" label="Título" value={v.hero.titulo} max={80} error={e["hero.titulo"]} onChange={(titulo) => set({ titulo })} />
      <CampoTextoMarca id="hero-subtitulo" label="Subtítulo (opcional)" value={v.hero.subtitulo} max={160} error={e["hero.subtitulo"]} onChange={(s) => set({ subtitulo: opcional(s) })} />
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTextoMarca id="hero-cta" label="Texto del botón" value={v.hero.ctaTexto} max={24} error={e["hero.ctaTexto"]} onChange={(ctaTexto) => set({ ctaTexto })} />
        <Field>
          <FieldLabel htmlFor="hero-destino">El botón lleva a</FieldLabel>
          <Select value={v.hero.ctaDestino} onValueChange={(d) => d && set({ ctaDestino: d as DestinoCta })}>
            <SelectTrigger id="hero-destino" className="w-full">
              <SelectValue>{(d: DestinoCta) => DESTINOS[d]?.nombre ?? "Elegí"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DESTINOS) as DestinoCta[]).map((d) => <SelectItem key={d} value={d}>{DESTINOS[d].nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
        <span>
          <span className="block text-sm font-medium">Botón "Probátela ahora"</span>
          <span className="block text-xs text-muted-foreground">Lleva al probador virtual con IA.</span>
        </span>
        <Switch checked={v.hero.mostrarProbador} onCheckedChange={(mostrarProbador) => set({ mostrarProbador })} />
      </label>
    </FieldGroup>
  )
}
