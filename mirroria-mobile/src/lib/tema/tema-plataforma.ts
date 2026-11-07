import { SEMANTICOS, type TemaResuelto } from './tokens';

// MirrorIA (plataforma): índigo #281B89 + lima #C3F74C (lima solo como relleno).
// Valores = los OKLCH de mirroria-frontend/src/index.css pasados a hex con color.ts.
export const TEMA_PLATAFORMA_CLARO: TemaResuelto = {
  oscuro: false,
  radio: 12,
  colores: {
    background: '#F9FAFE', foreground: '#13152F', card: '#FFFFFF', 'card-foreground': '#13152F',
    popover: '#FFFFFF', 'popover-foreground': '#13152F', primary: '#281B89', 'primary-foreground': '#F9FAFE',
    secondary: '#EEF0F8', 'secondary-foreground': '#13152F', muted: '#EEF0F8', 'muted-foreground': '#5F6275',
    accent: '#E6EAFC', 'accent-foreground': '#13152F', 'brand-accent': '#C3F74C', 'brand-accent-foreground': '#13152F',
    destructive: '#BE123C', 'destructive-foreground': '#FFFFFF', border: '#DEE1EC', input: '#DEE1EC', ring: '#423BC0',
    ...SEMANTICOS.claro,
  },
};

/** Noche índigo con primario lima. */
export const TEMA_PLATAFORMA_OSCURO: TemaResuelto = {
  oscuro: true,
  radio: 12,
  colores: {
    background: '#0B0D23', foreground: '#F3F5FB', card: '#151831', 'card-foreground': '#F3F5FB',
    popover: '#151831', 'popover-foreground': '#F3F5FB', primary: '#A9E932', 'primary-foreground': '#0B0D23',
    secondary: '#1E213C', 'secondary-foreground': '#F3F5FB', muted: '#1E213C', 'muted-foreground': '#A8ACC4',
    accent: '#242746', 'accent-foreground': '#F3F5FB', 'brand-accent': '#A9E932', 'brand-accent-foreground': '#0B0D23',
    destructive: '#FB7185', 'destructive-foreground': '#0B0D23', border: '#2C2F4C', input: '#343858', ring: '#A9E932',
    ...SEMANTICOS.oscuro,
  },
};

export const temaPlataforma = (oscuro: boolean) => (oscuro ? TEMA_PLATAFORMA_OSCURO : TEMA_PLATAFORMA_CLARO);
