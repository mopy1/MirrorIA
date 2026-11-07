// Contratos de la marca pública de cada tienda (copia de mirroria-frontend/src/types/marca.types.ts).

export type ModoMarca = "CLARO" | "OSCURO"
export type RadioMarca = "RECTO" | "SUAVE" | "REDONDO"
export type FuenteMarca = "geist" | "outfit" | "dm-sans" | "playfair"
export type DestinoCta = "CATALOGO" | "PROBADOR" | "SUCURSALES"
export type NivelMarca = "ESENCIAL" | "COMPLETA" | "MARCA_BLANCA"
export type SeccionMarca = "MARCA" | "COLORES" | "PORTADA" | "IMAGENES" | "TEXTOS" | "TODO"
export type CodigoPaleta = "grafito" | "terracota" | "oliva" | "oceano" | "ciruela" | "bosque"

export interface HeroMarca {
  imagenUrl: string
  titulo: string
  subtitulo: string | null
  ctaTexto: string
  ctaDestino: DestinoCta
  mostrarProbador: boolean
}

/** Lo que ve cualquiera: la marca EFECTIVA (ya recortada por el nivel del plan). */
export interface MarcaPublica {
  logoUrl: string | null
  faviconUrl: string | null
  colorPrimario: string // '#RRGGBB'
  colorAcento: string
  modo: ModoMarca
  radio: RadioMarca
  fuente: FuenteMarca
  hero: HeroMarca
  imagenes: { bannerSucursales: string | null; probador: string | null; acceso: string | null }
  textos: { eslogan: string | null; sobreNosotros: string | null }
  contacto: { instagram: string | null; facebook: string | null; tiktok: string | null; whatsapp: string | null; email: string | null }
  mostrarInsignia: boolean
}
