import { principalParaFondoClaro } from '../../appearance/lib/color';
import type { TiendaPublica } from '../types/saas.types';

/**
 * El logo se muestra solo si el teléfono puede cargarlo: un enlace https.
 * Las rutas `/images/...` las sirve la web (no existen en la app) y un SVG no
 * lo dibuja el <Image> nativo; en esos casos van las iniciales.
 */
export function logoParaApp(logoUrl: string | null | undefined, esWeb: boolean): string | null {
  if (!logoUrl || !logoUrl.startsWith('https://')) return null;
  if (!esWeb && /\.svg(\?|$)/i.test(logoUrl)) return null;
  return logoUrl;
}

/** "Casa Andina" → "CA"; "Nómada Urbana" → "NU"; "luna" → "LU". */
export function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return 'T';
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

export interface MarcaApp {
  nombre: string;
  slug: string;
  disponible: boolean;
  logoUrl: string | null;
  /** Principal legible sobre el fondo blanco de la app. */
  colorPrimario: string | null;
  eslogan: string | null;
}

/** Lo que la app necesita de la ficha pública de la tienda para pintar su marca. */
export function marcaParaApp(tienda: TiendaPublica, esWeb: boolean): MarcaApp {
  return {
    nombre: tienda.nombre,
    slug: tienda.slug,
    disponible: tienda.disponible,
    logoUrl: logoParaApp(tienda.marca?.logoUrl, esWeb),
    colorPrimario: tienda.marca ? principalParaFondoClaro(tienda.marca.colorPrimario) : null,
    eslogan: tienda.marca?.textos.eslogan ?? null,
  };
}
