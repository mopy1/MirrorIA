import type { FormatoReporte, Reporte, ReporteHibridoResponse, TonoMensaje } from '../types/reports.types';

/** Lógica pura del chat, portada de la web (`reportes-chat.utils.ts`, `narrativa.ts`, `formato-pedido.ts`). */

const PATRONES_META = [
  /que\s*(podes|puedes|sabes)\s*hacer/,
  /en\s*que\s*(me\s*)?(podes|puedes)\s*ayudar/,
  /que\s*(preguntas?|cosas?)\s*(te\s*)?puedo\s*(preguntar|hacer)/,
  /^\s*ayuda\s*$/,
  /como\s*(te\s*)?uso/,
  /^\s*(hola|hey|hi)\s*[.!]?\s*$/,
];

const normalizar = (t: string) => t.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** "¿Qué podés hacer?" se responde al toque, sin ir a la IA (funciona aunque no haya clave). */
export function respuestaMeta(texto: string): string | null {
  const n = normalizar(texto).replace(/[¿?¡!]/g, '');
  if (!PATRONES_META.some((p) => p.test(n))) return null;
  return (
    'Armo reportes con los datos reales de tu tienda: ventas, prendas, stock, reservas, ' +
    'cupones, clientas, compras a proveedores y sucursales. Preguntame en tus palabras, ' +
    'por ejemplo "¿Cuánto vendí este mes por sucursal?" o "Top 5 productos más vendidos".'
  );
}

export const SUGERENCIAS = [
  '¿Cuánto vendí este mes por sucursal?',
  'Top 5 productos más vendidos',
  '¿Qué categoría tiene más stock?',
  'Reservas por estado del último mes',
];

export function tituloDesdeTexto(texto: string, limite = 120): string {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  const conMayuscula = limpio.charAt(0).toUpperCase() + limpio.slice(1);
  if (conMayuscula.length <= limite) return conMayuscula;
  return `${conMayuscula.slice(0, limite - 1).trimEnd()}…`;
}

const LINEA_TABLA = /^\s*\|.*\|\s*$/;

/** Saca tablas markdown (la pantalla ya muestra la tabla real) y el primer título (repite la pregunta). */
export function limpiarNarrativa(md: string | null | undefined): string {
  if (!md) return '';
  const lineas = md.replace(/\r\n/g, '\n').split('\n').filter((l) => !LINEA_TABLA.test(l));
  const i = lineas.findIndex((l) => l.trim().length > 0);
  if (i >= 0 && /^#{1,3}\s/.test(lineas[i])) lineas.splice(i, 1);
  return lineas.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Markdown inline → texto plano (en el teléfono no hay renderizador de markdown). */
export function textoPlano(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Párrafos del análisis en texto plano (las viñetas quedan como "• …"). */
export function parrafosNarrativa(md: string | null | undefined): string[] {
  return limpiarNarrativa(md)
    .split(/\n\s*\n/)
    .map((p) => p.split('\n').map((l) => l.replace(/^\s*([-*+]|\d+\.)\s+/, '• ')).map(textoPlano).join('\n').trim())
    .filter((p) => p.length > 0);
}

/** Primera idea del análisis, recortada: la conclusión corta que va en la burbuja del chat. */
export function extraerConclusion(md: string | null | undefined, limite = 220): string | null {
  const primero = parrafosNarrativa(md).find((p) => !/[?:]$/.test(p) && !p.startsWith('•'));
  if (!primero) return null;
  const plano = primero.replace(/\s+/g, ' ');
  if (plano.length <= limite) return plano;
  const corte = plano.slice(0, limite);
  const fin = corte.lastIndexOf('. ');
  return fin > limite * 0.5 ? corte.slice(0, fin + 1) : `${corte.trimEnd()}…`;
}

export function textoReporteListo(narrativa: string | null | undefined): string {
  return extraerConclusion(narrativa) ?? 'Listo: armé el reporte con los datos de tu tienda.';
}

export interface Fallo {
  texto: string;
  tono: Exclude<TonoMensaje, 'normal'>;
  reintentable: boolean;
  sugerencias?: string[];
}

/**
 * Traduce un fallo de `POST /ia/reportes/hibrido` a un mensaje humano.
 * El 503 (IA sin configurar) se muestra TAL CUAL lo manda la API.
 * `status` 0 o null = no hubo respuesta (sin conexión).
 */
export function describirFallo(status: number | null, mensaje?: string): Fallo {
  if (status === 422) {
    return {
      tono: 'aclaracion',
      reintentable: false,
      texto: 'Eso no lo puedo responder con los datos de tu tienda. Probá preguntar por ventas, prendas, reservas, clientas o proveedores, por ejemplo:',
      sugerencias: SUGERENCIAS.slice(0, 2),
    };
  }
  if (!status) return { tono: 'error', reintentable: true, texto: 'No me pude conectar con el servidor. Revisá tu conexión y probá de nuevo.' };
  if (status === 503) {
    return {
      tono: 'error',
      reintentable: false,
      texto: mensaje?.trim() || 'La IA no está disponible en este momento. Mientras tanto podés usar «Armar sin IA».',
    };
  }
  if (status === 504) {
    return { tono: 'error', reintentable: true, texto: 'La IA tardó demasiado en responder. Probá de nuevo; si se repite, hacé la pregunta más concreta (por ejemplo, agregando el mes).' };
  }
  if (status === 403 && mensaje) return { tono: 'error', reintentable: false, texto: mensaje };
  if (status === 429 && mensaje) return { tono: 'error', reintentable: true, texto: mensaje };
  if (status === 400) return { tono: 'error', reintentable: false, texto: 'No pude cruzar esos datos en un mismo reporte. Probá preguntarlo de otra forma.' };
  return { tono: 'error', reintentable: true, texto: 'No pude armar el reporte por un problema del servidor. Probá de nuevo en un momento.' };
}

export function mapHibridoAReporte(h: ReporteHibridoResponse): Reporte {
  return {
    ficha: { metrica: h.metrica || (h.esSimulacion ? 'simulacion' : 'hibrido'), agruparPor: 'hibrido', filtros: {}, orden: 'desc', limite: h.filas.length },
    filas: h.filas.map((f, i) => ({ clave: String(i), ...f })),
    comparacion: null,
    narrativa: h.narrativa,
    pasosEjecutados: h.pasosEjecutados,
    esSimulacion: h.esSimulacion,
    tipoGraficoSugerido: h.tipoGraficoSugerido,
  };
}

/** "ventas por sucursal en pdf": se puede pedir el archivo en la misma frase. */
export function formatoPedido(texto: string): FormatoReporte | null {
  if (/\bpdf\b/i.test(texto)) return 'pdf';
  if (/\b(excel|xlsx|planilla|hoja de c[aá]lculo)\b/i.test(texto)) return 'excel';
  return null;
}
