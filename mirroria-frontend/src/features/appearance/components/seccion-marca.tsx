import { Monograma } from "@/components/marca/monograma"
import { FieldGroup } from "@/components/ui/field"
import { CampoImagen } from "./campo-imagen"
import { CampoTextoMarca } from "./campo-texto-marca"
import { CandadoPlan } from "./candado-plan"
import type { SeccionProps } from "./seccion-props"

/** Pestaña Marca: nombre visible, logo (con monograma de respaldo) y favicon (Cadena). */
export function SeccionMarca({ editor, mi }: SeccionProps) {
  const { vista: v, errores: e, actualizar } = editor
  return (
    <FieldGroup>
      <CampoTextoMarca id="nombre" label="Nombre de la tienda" value={v.nombre} max={120} error={e.nombre} ayuda={`Tu dirección sigue siendo /t/${mi.slug}.`} onChange={(nombre) => actualizar((b) => ({ ...b, nombre }))} />
      <CampoImagen
        id="logo"
        label="Logo"
        grupo="Portada"
        value={v.logoUrl}
        error={e.logoUrl}
        ayuda="Ideal: PNG o SVG con fondo transparente, más ancho que alto. Sin logo mostramos tus iniciales."
        respaldo={<Monograma nombre={v.nombre || "T"} className="size-full rounded-none text-base" />}
        onChange={(logoUrl) => actualizar((b) => ({ ...b, logoUrl }))}
      />
      <CandadoPlan titulo="Ícono de la pestaña" nivel="MARCA_BLANCA" bloqueado={!mi.permitido.favicon}>
        <CampoImagen
          id="favicon"
          label="Favicon"
          grupo="Portada"
          value={v.faviconUrl}
          error={e.faviconUrl}
          ayuda="Cuadrado, se ve chiquito en la pestaña del navegador. Sin favicon usamos tu logo."
          onChange={(faviconUrl) => actualizar((b) => ({ ...b, faviconUrl }))}
        />
      </CandadoPlan>
    </FieldGroup>
  )
}
