// Catálogos cerrados de la marca (espejo de la web lib/tema/marca.constants.ts).
import type {
  CodigoPaleta, DestinoCta, FuenteMarca, MarcaPublica, NivelMarca, RadioMarca, SeccionMarca,
} from '../../saas/types/saas.types';

export const FUENTES: Record<FuenteMarca, { nombre: string }> = {
  geist: { nombre: 'Moderna' },
  outfit: { nombre: 'Geométrica' },
  'dm-sans': { nombre: 'Amable' },
  playfair: { nombre: 'Editorial' },
};

export const RADIOS: Record<RadioMarca, { nombre: string; valor: number }> = {
  RECTO: { nombre: 'Rectos', valor: 4 },
  SUAVE: { nombre: 'Suaves', valor: 12 },
  REDONDO: { nombre: 'Redondos', valor: 20 },
};

export const DESTINOS: Record<DestinoCta, { nombre: string }> = {
  CATALOGO: { nombre: 'Catálogo' },
  PROBADOR: { nombre: 'Probador virtual' },
  SUCURSALES: { nombre: 'Sucursales' },
};

const portada = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&h=900&fit=crop&q=80&auto=format`;

export const PALETAS: Record<CodigoPaleta, { nombre: string; primario: string; acento: string; portada: string }> = {
  grafito: { nombre: 'Grafito', primario: '#26282E', acento: '#E3C14B', portada: portada('1441984904996-e0b6ba687e04') },
  terracota: { nombre: 'Terracota', primario: '#9C3D24', acento: '#F3C9AE', portada: portada('1558769132-cb1aea458c5e') },
  oliva: { nombre: 'Oliva', primario: '#4B5B22', acento: '#D7E3A0', portada: portada('1490481651871-ab68de25d43d') },
  oceano: { nombre: 'Océano', primario: '#0E4D74', acento: '#93D4E6', portada: portada('1539109136881-3be0616acf4b') },
  ciruela: { nombre: 'Ciruela', primario: '#5C1F50', acento: '#F2AACB', portada: portada('1483985988355-763728e1935b') },
  bosque: { nombre: 'Bosque', primario: '#1F4E3B', acento: '#EAB872', portada: portada('1485968579580-b6d095142e6e') },
};
export const CODIGOS_PALETA = Object.keys(PALETAS) as CodigoPaleta[];

/** Plan mínimo que incluye cada nivel (candados del editor). */
export const PLAN_DE_NIVEL: Record<NivelMarca, string> = {
  ESENCIAL: 'Básico',
  COMPLETA: 'Crecimiento',
  MARCA_BLANCA: 'Cadena',
};

export const SECCIONES_RESTABLECER: { valor: SeccionMarca; label: string; detalle: string }[] = [
  { valor: 'MARCA', label: 'Logo y favicon', detalle: 'Se quitan el logo y el favicon.' },
  { valor: 'COLORES', label: 'Colores y estilo', detalle: 'Vuelven los colores de tu paleta inicial, modo claro, bordes suaves y fuente Moderna.' },
  { valor: 'PORTADA', label: 'Portada', detalle: 'Vuelven la imagen y los textos iniciales de la portada.' },
  { valor: 'IMAGENES', label: 'Imágenes', detalle: 'Se quitan las imágenes de las secciones.' },
  { valor: 'TEXTOS', label: 'Textos y contacto', detalle: 'Se borran eslogan, sobre nosotras, redes y contacto.' },
  { valor: 'TODO', label: 'Todo', detalle: 'Toda la apariencia vuelve a como estaba al crear la tienda. El nombre no cambia.' },
];

/** Marca de respaldo cuando el backend no manda `marca`: una tienda grafito sobria. */
export function marcaPorDefecto(nombre: string, paleta: CodigoPaleta = 'grafito'): MarcaPublica {
  return {
    logoUrl: null,
    faviconUrl: null,
    colorPrimario: PALETAS[paleta].primario,
    colorAcento: PALETAS[paleta].acento,
    modo: 'CLARO',
    radio: 'SUAVE',
    fuente: 'geist',
    hero: {
      imagenUrl: PALETAS[paleta].portada,
      titulo: `Bienvenida a ${nombre}`.slice(0, 80),
      subtitulo: 'Encontrá tu talla, reservala en la sucursal y probátela antes de decidir.',
      ctaTexto: 'Ver catálogo',
      ctaDestino: 'CATALOGO',
      mostrarProbador: true,
    },
    imagenes: { bannerSucursales: null, probador: null, acceso: null },
    textos: { eslogan: null, sobreNosotros: null },
    contacto: { instagram: null, facebook: null, tiktok: null, whatsapp: null, email: null },
    mostrarInsignia: true,
  };
}
