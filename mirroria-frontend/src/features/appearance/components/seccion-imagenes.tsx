import { FieldGroup } from "@/components/ui/field"
import type { MarcaPublica } from "@/types/marca.types"
import { CampoImagen } from "./campo-imagen"
import { CandadoPlan } from "./candado-plan"
import type { SeccionProps } from "./seccion-props"

type ClaveImagen = keyof MarcaPublica["imagenes"]

const CAMPOS: { clave: ClaveImagen; label: string; grupo: "Sucursal" | "Probador" | "Acceso"; ayuda: string }[] = [
  { clave: "bannerSucursales", label: "Franja de sucursales", grupo: "Sucursal", ayuda: "La franja \"Probátela en persona\" del inicio. Panorámica." },
  { clave: "probador", label: "Tarjeta del vestidor virtual", grupo: "Probador", ayuda: "La tarjeta grande que invita a probarse con IA." },
  { clave: "acceso", label: "Foto de ingreso y registro", grupo: "Acceso", ayuda: "Vertical. Sin foto usamos la de tu portada." },
]

/** Pestaña Imágenes: fotos de las secciones de la tienda (desde el plan Crecimiento). */
export function SeccionImagenes({ editor, mi }: SeccionProps) {
  const { vista: v, errores: e, actualizar } = editor
  return (
    <CandadoPlan titulo="Imágenes de las secciones" nivel="COMPLETA" bloqueado={!mi.permitido.imagenesSecciones}>
      <FieldGroup>
        {CAMPOS.map((c) => (
          <CampoImagen
            key={c.clave}
            id={`img-${c.clave}`}
            label={c.label}
            grupo={c.grupo}
            ayuda={c.ayuda}
            value={v.imagenes[c.clave]}
            error={e[`imagenes.${c.clave}`]}
            onChange={(url) => actualizar((b) => ({ ...b, imagenes: { ...b.imagenes, [c.clave]: url } }))}
          />
        ))}
      </FieldGroup>
    </CandadoPlan>
  )
}
