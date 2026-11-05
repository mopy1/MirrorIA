// Catálogos cerrados de la marca (spec Fase 1b §A.4). Espejo de
// `mirroria-backend/src/modules/saas/marca/marca-reglas.ts`.
import type {
  CodigoPaleta, DestinoCta, FuenteMarca, MarcaPublica, NivelMarca, RadioMarca,
} from "@/types/marca.types"

export const FUENTES: Record<FuenteMarca, { nombre: string; pila: string }> = {
  geist: { nombre: "Moderna", pila: "'Geist Variable', sans-serif" },
  outfit: { nombre: "Geométrica", pila: "'Outfit Variable', 'Geist Variable', sans-serif" },
  "dm-sans": { nombre: "Amable", pila: "'DM Sans Variable', 'Geist Variable', sans-serif" },
  playfair: { nombre: "Editorial", pila: "'Playfair Display Variable', Georgia, serif" },
}

/** Tipografía de títulos de MirrorIA (ninguna tienda puede elegirla). */
export const FUENTE_PLATAFORMA = "'Bricolage Grotesque Variable', 'Geist Variable', sans-serif"

export const RADIOS: Record<RadioMarca, { nombre: string; valor: string }> = {
  RECTO: { nombre: "Rectos", valor: "0.25rem" },
  SUAVE: { nombre: "Suaves", valor: "0.75rem" },
  REDONDO: { nombre: "Redondos", valor: "1.25rem" },
}

export const DESTINOS: Record<DestinoCta, { nombre: string; ruta: string }> = {
  CATALOGO: { nombre: "Catálogo", ruta: "/tienda" },
  PROBADOR: { nombre: "Probador virtual", ruta: "/probador" },
  SUCURSALES: { nombre: "Sucursales", ruta: "/sucursales" },
}

/** Portada de 16:9 de Unsplash (las mismas que siembra el backend por paleta, BE1b-4). */
export const portadaUnsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&h=900&fit=crop&q=80&auto=format`

export const PALETAS: Record<CodigoPaleta, { nombre: string; primario: string; acento: string; portada: string }> = {
  grafito: { nombre: "Grafito", primario: "#26282E", acento: "#E3C14B", portada: portadaUnsplash("1441984904996-e0b6ba687e04") },
  terracota: { nombre: "Terracota", primario: "#9C3D24", acento: "#F3C9AE", portada: portadaUnsplash("1558769132-cb1aea458c5e") },
  oliva: { nombre: "Oliva", primario: "#4B5B22", acento: "#D7E3A0", portada: portadaUnsplash("1490481651871-ab68de25d43d") },
  oceano: { nombre: "Océano", primario: "#0E4D74", acento: "#93D4E6", portada: portadaUnsplash("1539109136881-3be0616acf4b") },
  ciruela: { nombre: "Ciruela", primario: "#5C1F50", acento: "#F2AACB", portada: portadaUnsplash("1483985988355-763728e1935b") },
  bosque: { nombre: "Bosque", primario: "#1F4E3B", acento: "#EAB872", portada: portadaUnsplash("1485968579580-b6d095142e6e") },
}
export const CODIGOS_PALETA = Object.keys(PALETAS) as CodigoPaleta[]

export const esPaleta = (v: string | null | undefined): v is CodigoPaleta => !!v && v in PALETAS

/** Qué incluye cada nivel (para candados, `/planes` y la plataforma). */
export const NIVELES: Record<NivelMarca, { plan: string; incluye: string; resumen: string }> = {
  ESENCIAL: { plan: "Básico", incluye: "Logo, colores, portada, textos y redes", resumen: "logo, colores, portada, textos y redes" },
  COMPLETA: { plan: "Crecimiento", incluye: "Además: fuente, bordes, modo oscuro e imágenes de secciones", resumen: "también fuente, bordes, modo oscuro e imágenes" },
  MARCA_BLANCA: { plan: "Cadena", incluye: "Además: favicon propio y sin \"Hecho con MirrorIA\"", resumen: "personalización completa, con favicon y sin insignia" },
}
export const ORDEN_NIVEL: NivelMarca[] = ["ESENCIAL", "COMPLETA", "MARCA_BLANCA"]

/** Marca de respaldo cuando el backend todavía no manda `marca` (o falla): una tienda grafito sobria. */
export function marcaPorDefecto(nombre: string, paleta: CodigoPaleta = "grafito"): MarcaPublica {
  return {
    logoUrl: null,
    faviconUrl: null,
    colorPrimario: PALETAS[paleta].primario,
    colorAcento: PALETAS[paleta].acento,
    modo: "CLARO",
    radio: "SUAVE",
    fuente: "geist",
    hero: {
      imagenUrl: PALETAS[paleta].portada,
      titulo: `Bienvenida a ${nombre}`.slice(0, 80),
      subtitulo: "Encontrá tu talla, reservala en la sucursal y probátela antes de decidir.",
      ctaTexto: "Ver catálogo",
      ctaDestino: "CATALOGO",
      mostrarProbador: true,
    },
    imagenes: { bannerSucursales: null, probador: null, acceso: null },
    textos: { eslogan: null, sobreNosotros: null },
    contacto: { instagram: null, facebook: null, tiktok: null, whatsapp: null, email: null },
    mostrarInsignia: true,
  }
}

/** La marca de una tienda pública, o la de respaldo si el backend todavía no la manda. */
export function marcaDe(tienda: { nombre: string; marca?: MarcaPublica }): MarcaPublica {
  return tienda.marca ?? marcaPorDefecto(tienda.nombre)
}
