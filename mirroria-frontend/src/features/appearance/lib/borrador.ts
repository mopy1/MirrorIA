import type { MarcaPublica, MiMarcaDto, PermisosMarca } from "@/types/marca.types"
import type { BorradorMarca } from "../types/apariencia.types"

/** Vacío → null (los campos opcionales del DTO no aceptan ""). No recorta: se está escribiendo. */
export const opcional = (v: string) => (v.trim() === "" ? null : v)

/** Recorta los textos libres antes del PUT. */
export function paraGuardar(b: BorradorMarca): BorradorMarca {
  const t = (v: string | null) => (v === null ? null : v.trim() || null)
  return {
    ...b,
    nombre: b.nombre.trim(),
    hero: { ...b.hero, titulo: b.hero.titulo.trim(), subtitulo: t(b.hero.subtitulo), ctaTexto: b.hero.ctaTexto.trim() },
    textos: { eslogan: t(b.textos.eslogan), sobreNosotros: t(b.textos.sobreNosotros) },
  }
}

export function borradorDesde(mi: MiMarcaDto): BorradorMarca {
  return { ...structuredClone(mi.guardada), nombre: mi.nombre }
}

/**
 * Lo que el plan no permite toma el valor EFECTIVO (el default de su nivel):
 * así la vista previa muestra lo que verá el público. El PUT, en cambio, manda
 * el borrador con lo guardado intacto: el back solo da 409 si un campo
 * bloqueado cambia respecto de lo guardado (BE1b-1), y así bajar de plan no borra nada.
 */
export function conBloqueos<T extends MarcaPublica>(b: T, efectiva: MarcaPublica, p: PermisosMarca): T {
  return {
    ...b,
    ...(p.estilo ? {} : { modo: efectiva.modo, radio: efectiva.radio, fuente: efectiva.fuente }),
    ...(p.imagenesSecciones ? {} : { imagenes: efectiva.imagenes }),
    ...(p.favicon ? {} : { faviconUrl: efectiva.faviconUrl }),
    ...(p.quitarInsignia ? {} : { mostrarInsignia: efectiva.mostrarInsignia }),
  }
}

export const mismoBorrador = (a: BorradorMarca, b: BorradorMarca) => JSON.stringify(a) === JSON.stringify(b)
