// Borrador y validación de la marca: mismas reglas que la web
// (appearance/lib/borrador.ts y validar-marca.ts) y que el backend.
import { formatRatio, REGEX_HEX, validarPrincipal, type ModoMarca } from './color';
import type { MarcaPublica } from '../../saas/types/saas.types';
import type { BorradorMarca, ErroresMarca, MiMarcaDto, PermisosMarca } from '../types/apariencia.types';

/** Vacío → null (los campos opcionales no aceptan ""). No recorta: se está escribiendo. */
export const opcional = (v: string) => (v.trim() === '' ? null : v);

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export function borradorDesde(mi: MiMarcaDto): BorradorMarca {
  return { ...copia(mi.guardada), nombre: mi.nombre };
}

/** Recorta los textos libres antes del PUT. */
export function paraGuardar(b: BorradorMarca): BorradorMarca {
  const t = (v: string | null) => (v === null ? null : v.trim() || null);
  return {
    ...b,
    nombre: b.nombre.trim(),
    hero: { ...b.hero, titulo: b.hero.titulo.trim(), subtitulo: t(b.hero.subtitulo), ctaTexto: b.hero.ctaTexto.trim() },
    textos: { eslogan: t(b.textos.eslogan), sobreNosotros: t(b.textos.sobreNosotros) },
  };
}

/**
 * Lo que el plan no permite toma el valor EFECTIVO: así la vista previa
 * muestra lo que verá el público. El PUT manda el borrador con lo guardado
 * intacto (el back solo da 409 si un campo bloqueado cambia).
 */
export function conBloqueos<T extends MarcaPublica>(b: T, efectiva: MarcaPublica, p: PermisosMarca): T {
  return {
    ...b,
    ...(p.estilo ? {} : { modo: efectiva.modo, radio: efectiva.radio, fuente: efectiva.fuente }),
    ...(p.imagenesSecciones ? {} : { imagenes: efectiva.imagenes }),
    ...(p.favicon ? {} : { faviconUrl: efectiva.faviconUrl }),
    ...(p.quitarInsignia ? {} : { mostrarInsignia: efectiva.mostrarInsignia }),
  };
}

export const mismoBorrador = (a: BorradorMarca, b: BorradorMarca) => JSON.stringify(a) === JSON.stringify(b);

export const REGEX_URL_IMAGEN = /^(https:\/\/[^\s"'<>()]{8,490}|\/images\/[a-z0-9/_.-]{3,120}\.(webp|jpg|jpeg|png|svg))$/;
const REGEX = {
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  facebook: /^[A-Za-z0-9.]{1,60}$/,
  tiktok: /^[A-Za-z0-9._]{1,30}$/,
  whatsapp: /^\+?[0-9]{8,15}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
const MSG_URL = 'Usá un enlace https:// a una imagen.';

function largo(v: string | null, min: number, max: number, campo: string, e: ErroresMarca) {
  const n = (v ?? '').trim().length;
  if (n < min) e[campo] = min === 1 ? 'Este campo es obligatorio' : `Mínimo ${min} caracteres`;
  else if (n > max) e[campo] = `Máximo ${max} caracteres`;
}

function url(v: string | null, campo: string, e: ErroresMarca, obligatoria = false) {
  if (!v) {
    if (obligatoria) e[campo] = 'Elegí una imagen';
    return;
  }
  if (!REGEX_URL_IMAGEN.test(v)) e[campo] = MSG_URL;
}

/** Mensaje del aviso de contraste (mismo texto que el 400 del backend). */
export function errorContraste(hex: string, modo: ModoMarca): string | null {
  const { ok, ratio } = validarPrincipal(hex, modo);
  const fondo = modo === 'CLARO' ? 'claro' : 'oscuro';
  return ok ? null : `Este color se lee poco sobre el fondo ${fondo} (${formatRatio(ratio)}). Necesita 4.5:1.`;
}

export function validarMarca(b: BorradorMarca): ErroresMarca {
  const e: ErroresMarca = {};
  largo(b.nombre, 3, 120, 'nombre', e);
  if (!REGEX_HEX.test(b.colorPrimario)) e.colorPrimario = 'Formato #RRGGBB';
  else {
    const c = errorContraste(b.colorPrimario, b.modo);
    if (c) e.colorPrimario = c;
  }
  if (!REGEX_HEX.test(b.colorAcento)) e.colorAcento = 'Formato #RRGGBB';
  url(b.logoUrl, 'logoUrl', e);
  url(b.faviconUrl, 'faviconUrl', e);
  url(b.hero.imagenUrl, 'hero.imagenUrl', e, true);
  url(b.imagenes.bannerSucursales, 'imagenes.bannerSucursales', e);
  url(b.imagenes.probador, 'imagenes.probador', e);
  url(b.imagenes.acceso, 'imagenes.acceso', e);
  largo(b.hero.titulo, 3, 80, 'hero.titulo', e);
  largo(b.hero.subtitulo, 0, 160, 'hero.subtitulo', e);
  largo(b.hero.ctaTexto, 2, 24, 'hero.ctaTexto', e);
  largo(b.textos.eslogan, 0, 120, 'textos.eslogan', e);
  largo(b.textos.sobreNosotros, 0, 600, 'textos.sobreNosotros', e);
  for (const k of Object.keys(REGEX) as (keyof typeof REGEX)[]) {
    const v = b.contacto[k];
    if (v && !REGEX[k].test(v)) e[`contacto.${k}`] = k === 'email' ? 'Email inválido' : 'Revisá el formato';
  }
  return e;
}
