/**
 * Contraste WCAG 2.x de los colores de marca (spec Fase 1b §B.2). Mismo algoritmo y
 * mismos casos de test que `src/lib/tema/color.ts` del front. Funciones puras, sin Nest.
 */
export type ModoFondo = 'CLARO' | 'OSCURO';

/** Fondo de la tienda en cada modo: oklch(1 0 0) / oklch(0.145 0 0). */
export const FONDO_TIENDA: Record<ModoFondo, string> = { CLARO: '#FFFFFF', OSCURO: '#0A0A0A' };
export const CONTRASTE_MINIMO = 4.5;
/**
 * Blanco/negro puros: con ellos el peor caso es 4.58:1. Con #FAFAFA/#141414 (lo que decía la
 * spec) el peor caso medido es 4.37:1 (desviación BE1b-2).
 */
const TEXTO_CLARO = '#FFFFFF';
const TEXTO_OSCURO = '#000000';

export function hexARgb(hex: string): [number, number, number] {
  const limpio = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(limpio.slice(i, i + 2), 16)) as [number, number, number];
}

/** Luminancia relativa (sRGB linealizado, umbral 0.03928 de WCAG 2.x). */
export function luminancia(hex: string): number {
  const [r, g, b] = hexARgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** (L1 + 0.05) / (L2 + 0.05), con L1 la mayor. Entre 1 y 21. */
export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** El texto (casi blanco o casi negro) que más contrasta sobre `hex`. */
export function textoSobre(hex: string): '#FFFFFF' | '#000000' {
  return contraste(hex, TEXTO_CLARO) >= contraste(hex, TEXTO_OSCURO) ? TEXTO_CLARO : TEXTO_OSCURO;
}

/** El color principal se usa como texto (links): ≥ 4.5:1 contra el fondo del modo. */
export function validarPrincipal(hex: string, modo: ModoFondo): { ok: boolean; ratio: number } {
  const ratio = contraste(hex, FONDO_TIENDA[modo]);
  return { ok: ratio >= CONTRASTE_MINIMO, ratio };
}

/** "4.4:1" truncado (nunca redondea un 4.47 a "4.5" en un mensaje de error). */
export function formatearRatio(ratio: number): string {
  return `${(Math.floor(ratio * 10) / 10).toFixed(1)}:1`;
}
