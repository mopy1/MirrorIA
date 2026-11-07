import { hexARgb } from './color';

/** Nombres de los tokens semánticos (los mismos de global.css y tailwind.config.js). */
export const NOMBRES_TOKEN = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'brand-accent', 'brand-accent-foreground',
  'destructive', 'destructive-foreground', 'border', 'input', 'ring',
  'success', 'warning', 'danger', 'info',
] as const;

export type NombreToken = (typeof NOMBRES_TOKEN)[number];

/** Un tema completo: colores en `#RRGGBB`, radio en px y si es oscuro. */
export interface TemaResuelto {
  colores: Record<NombreToken, string>;
  radio: number;
  oscuro: boolean;
}

/** Semánticos fijos (outbox, reservas, stock): no cambian por tienda, solo por modo. */
export const SEMANTICOS = {
  claro: { success: '#15803D', warning: '#B45309', danger: '#BE123C', info: '#1D4ED8' },
  oscuro: { success: '#4ADE80', warning: '#FBBF24', danger: '#FB7185', info: '#60A5FA' },
} as const;

/** Tema → variables de NativeWind (`vars()`): colores como "R G B" para que anden las opacidades. */
export function aVariables(tema: TemaResuelto): Record<string, string> {
  const vars: Record<string, string> = { '--radius': `${tema.radio}px` };
  for (const nombre of NOMBRES_TOKEN) vars[`--${nombre}`] = hexARgb(tema.colores[nombre]).join(' ');
  return vars;
}
