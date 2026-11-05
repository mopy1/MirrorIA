/**
 * Reglas de la marca de cada tienda (spec Fase 1b §A, §C.4, §C.5). Lógica pura, sin Nest:
 * catálogos cerrados, paletas, marca inicial y de MirrorIA, recorte por nivel del plan y
 * restablecer por sección. El front tiene el espejo en `src/lib/tema/marca.constants.ts`.
 */
export const MODOS = ['CLARO', 'OSCURO'] as const;
export const RADIOS = ['RECTO', 'SUAVE', 'REDONDO'] as const;
export const FUENTES = ['geist', 'outfit', 'dm-sans', 'playfair'] as const;
export const DESTINOS_CTA = ['CATALOGO', 'PROBADOR', 'SUCURSALES'] as const;
export const NIVELES_MARCA = ['ESENCIAL', 'COMPLETA', 'MARCA_BLANCA'] as const;
export const SECCIONES_MARCA = ['MARCA', 'COLORES', 'PORTADA', 'IMAGENES', 'TEXTOS', 'TODO'] as const;
export const CODIGOS_PALETA = ['grafito', 'terracota', 'oliva', 'oceano', 'ciruela', 'bosque'] as const;

export type ModoMarca = (typeof MODOS)[number];
export type RadioMarca = (typeof RADIOS)[number];
export type FuenteMarca = (typeof FUENTES)[number];
export type DestinoCta = (typeof DESTINOS_CTA)[number];
export type NivelMarca = (typeof NIVELES_MARCA)[number];
export type SeccionMarca = (typeof SECCIONES_MARCA)[number];
/** Cómo se lee cada sección en la bitácora (el código crudo "TODO" parecía un pendiente). */
export const SECCION_TEXTO: Record<SeccionMarca, string> = {
  MARCA: 'Logo y favicon', COLORES: 'Colores y estilo', PORTADA: 'Portada',
  IMAGENES: 'Imágenes', TEXTOS: 'Textos y contacto', TODO: 'Toda la apariencia',
};
export type CodigoPaleta = (typeof CODIGOS_PALETA)[number];

/** https (sin espacios, comillas ni paréntesis) o un asset propio del front. Nada de http:, data: ni javascript:. */
export const REGEX_URL_IMAGEN =
  /^(https:\/\/[^\s"'<>()]{8,490}|\/images\/[a-z0-9/_.-]{3,120}\.(webp|jpg|jpeg|png|svg))$/;

const unsplash = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
/** Portada de cada paleta: fotos de moda femenina verificadas (curl 200, revisadas a ojo). */
const portada = (id: string) => unsplash(id, 1600, 900);

export const PALETAS: Record<CodigoPaleta | 'mirroria', { primario: string; acento: string; heroImagenUrl: string }> = {
  grafito: { primario: '#26282E', acento: '#E3C14B', heroImagenUrl: portada('1441984904996-e0b6ba687e04') },
  terracota: { primario: '#9C3D24', acento: '#F3C9AE', heroImagenUrl: portada('1558769132-cb1aea458c5e') },
  oliva: { primario: '#4B5B22', acento: '#D7E3A0', heroImagenUrl: portada('1490481651871-ab68de25d43d') },
  oceano: { primario: '#0E4D74', acento: '#93D4E6', heroImagenUrl: portada('1539109136881-3be0616acf4b') },
  ciruela: { primario: '#5C1F50', acento: '#F2AACB', heroImagenUrl: portada('1483985988355-763728e1935b') },
  bosque: { primario: '#1F4E3B', acento: '#EAB872', heroImagenUrl: portada('1485968579580-b6d095142e6e') },
  mirroria: { primario: '#820025', acento: '#EDA6C1', heroImagenUrl: '/images/hero-model.webp' },
};

/** Una fila de `inquilino_marca`, plana (sin id ni tienda). */
export interface DatosMarca {
  paleta: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  colorPrimario: string;
  colorAcento: string;
  modo: ModoMarca;
  radio: RadioMarca;
  fuente: FuenteMarca;
  heroImagenUrl: string;
  heroTitulo: string;
  heroSubtitulo: string | null;
  heroCtaTexto: string;
  heroCtaDestino: DestinoCta;
  heroMostrarProbador: boolean;
  bannerSucursalesUrl: string | null;
  imagenProbadorUrl: string | null;
  imagenAccesoUrl: string | null;
  eslogan: string | null;
  sobreNosotros: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  whatsapp: string | null;
  emailContacto: string | null;
  mostrarInsignia: boolean;
}

const SIN_TEXTOS = {
  eslogan: null, sobreNosotros: null, instagram: null, facebook: null, tiktok: null,
  whatsapp: null, emailContacto: null, mostrarInsignia: true,
};

/** Marca con la que nace una tienda (§A.7). */
export function marcaInicial(nombre: string, paleta: CodigoPaleta = 'grafito'): DatosMarca {
  const p = PALETAS[paleta];
  return {
    paleta, logoUrl: null, faviconUrl: null,
    colorPrimario: p.primario, colorAcento: p.acento,
    modo: 'CLARO', radio: 'SUAVE', fuente: 'geist',
    heroImagenUrl: p.heroImagenUrl,
    heroTitulo: `Bienvenida a ${nombre}`.slice(0, 80),
    heroSubtitulo: 'Encontrá tu talla, reservala en la sucursal y probátela antes de decidir.',
    heroCtaTexto: 'Ver catálogo', heroCtaDestino: 'CATALOGO', heroMostrarProbador: true,
    bannerSucursalesUrl: null, imagenProbadorUrl: null, imagenAccesoUrl: null,
    ...SIN_TEXTOS,
  };
}

/** La marca de MirrorIA (se ve exactamente como antes de la Fase 1b). */
export const MARCA_MIRRORIA: DatosMarca = {
  paleta: 'mirroria', logoUrl: '/images/marcas/mirroria.svg', faviconUrl: null,
  colorPrimario: '#820025', colorAcento: '#EDA6C1',
  modo: 'CLARO', radio: 'SUAVE', fuente: 'geist',
  heroImagenUrl: '/images/hero-model.webp',
  heroTitulo: 'Mírate con la prenda puesta, antes de decidir.',
  heroSubtitulo:
    'Explorá el catálogo, reservá tu talla en la sucursal más cercana y probátela en persona cuando quieras.',
  heroCtaTexto: 'Ver catálogo', heroCtaDestino: 'CATALOGO', heroMostrarProbador: true,
  bannerSucursalesUrl: unsplash('1761090617068-f1b3257d27ad', 1600, 700),
  imagenProbadorUrl: unsplash('1753161027818-28b1f73a8fdf', 1200, 900),
  imagenAccesoUrl: unsplash('1759630752910-c4f9f628cf88', 1200, 1600),
  ...SIN_TEXTOS,
  eslogan: 'Moda femenina con vestidor virtual',
};

/** Defaults de "restablecer": MirrorIA vuelve a lo suyo, el resto a su paleta. */
export function marcaPorDefecto(nombre: string, paleta: string): DatosMarca {
  if (paleta === 'mirroria') return { ...MARCA_MIRRORIA };
  return marcaInicial(nombre, (CODIGOS_PALETA as readonly string[]).includes(paleta) ? (paleta as CodigoPaleta) : 'grafito');
}

/** Campos que cada sección restablece (§C.5). Nunca `paleta` ni el nombre. */
export const CAMPOS_SECCION: Record<Exclude<SeccionMarca, 'TODO'>, Array<keyof DatosMarca>> = {
  MARCA: ['logoUrl', 'faviconUrl'],
  COLORES: ['colorPrimario', 'colorAcento', 'modo', 'radio', 'fuente'],
  PORTADA: ['heroImagenUrl', 'heroTitulo', 'heroSubtitulo', 'heroCtaTexto', 'heroCtaDestino', 'heroMostrarProbador'],
  IMAGENES: ['bannerSucursalesUrl', 'imagenProbadorUrl', 'imagenAccesoUrl'],
  TEXTOS: ['eslogan', 'sobreNosotros', 'instagram', 'facebook', 'tiktok', 'whatsapp', 'emailContacto', 'mostrarInsignia'],
};

export function restablecerSeccion(actual: DatosMarca, seccion: SeccionMarca, defecto: DatosMarca): DatosMarca {
  const secciones = seccion === 'TODO' ? Object.values(CAMPOS_SECCION) : [CAMPOS_SECCION[seccion]];
  const nueva: DatosMarca = { ...actual };
  for (const campo of secciones.flat()) Object.assign(nueva, { [campo]: defecto[campo] });
  return nueva;
}

// ---------------------------------------------------------------- niveles del plan (§C.4)

/** Lo que exige un nivel superior a ESENCIAL, con su valor "apagado" y cómo se nombra en el 409. */
const BLOQUEOS: Array<{ nivel: NivelMarca; campos: Partial<DatosMarca>; que: string }> = [
  { nivel: 'COMPLETA', campos: { fuente: 'geist' }, que: 'cambiar la fuente de títulos' },
  { nivel: 'COMPLETA', campos: { radio: 'SUAVE' }, que: 'cambiar la forma de los bordes' },
  { nivel: 'COMPLETA', campos: { modo: 'CLARO' }, que: 'el modo oscuro' },
  {
    nivel: 'COMPLETA',
    campos: { bannerSucursalesUrl: null, imagenProbadorUrl: null, imagenAccesoUrl: null },
    que: 'las imágenes de secciones',
  },
  { nivel: 'MARCA_BLANCA', campos: { faviconUrl: null }, que: 'un favicon propio' },
  { nivel: 'MARCA_BLANCA', campos: { mostrarInsignia: true }, que: 'quitar el sello "Hecho con Tiendaria"' },
];

export function incluyeNivel(nivel: NivelMarca, requerido: NivelMarca): boolean {
  return NIVELES_MARCA.indexOf(nivel) >= NIVELES_MARCA.indexOf(requerido);
}

export function permitidoPorNivel(nivel: NivelMarca) {
  return {
    estilo: incluyeNivel(nivel, 'COMPLETA'),
    imagenesSecciones: incluyeNivel(nivel, 'COMPLETA'),
    favicon: incluyeNivel(nivel, 'MARCA_BLANCA'),
    quitarInsignia: incluyeNivel(nivel, 'MARCA_BLANCA'),
  };
}

/** Lo que ve el público: cada campo que el nivel no incluye vuelve a su valor apagado. Lo guardado no se toca. */
export function marcaEfectiva(guardada: DatosMarca, nivel: NivelMarca): DatosMarca {
  const efectiva: DatosMarca = { ...guardada };
  for (const b of BLOQUEOS) if (!incluyeNivel(nivel, b.nivel)) Object.assign(efectiva, b.campos);
  return efectiva;
}

/**
 * Primer campo bloqueado por el nivel cuyo valor nuevo difiere del apagado Y de lo que ya
 * estaba guardado (así una tienda que bajó de plan puede seguir guardando el resto). null = ok.
 */
export function fueraDelPlan(nueva: DatosMarca, guardada: DatosMarca, nivel: NivelMarca): string | null {
  for (const b of BLOQUEOS) {
    if (incluyeNivel(nivel, b.nivel)) continue;
    const campos = Object.keys(b.campos) as Array<keyof DatosMarca>;
    if (campos.some((c) => nueva[c] !== b.campos[c] && nueva[c] !== guardada[c])) return b.que;
  }
  return null;
}
