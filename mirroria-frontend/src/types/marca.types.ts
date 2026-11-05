// Contratos de la marca de cada tienda (spec Fase 1b §D.6). Compartidos por
// saas, appearance, platform, el TenantProvider y el AdminLayout.

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

/** PUT /saas/mi-marca: objeto completo. */
export interface ActualizarMarcaDto extends MarcaPublica {
  nombre: string
}

export interface PermisosMarca {
  estilo: boolean
  imagenesSecciones: boolean
  favicon: boolean
  quitarInsignia: boolean
}

export interface MiMarcaDto {
  nombre: string
  slug: string
  paleta: CodigoPaleta | "mirroria"
  guardada: MarcaPublica
  efectiva: MarcaPublica
  nivel: NivelMarca
  planNombre: string
  permitido: PermisosMarca
}

export interface EstadisticasPublicasDto {
  tiendasAbiertas: number
  prendasPublicadas: number
  ciudades: number
}

/** Miniatura de marca para listados de la plataforma. */
export interface MarcaMini {
  logoUrl: string | null
  colorPrimario: string
  heroImagenUrl: string
}
