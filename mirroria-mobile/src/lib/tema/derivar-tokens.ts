// Port de mirroria-frontend/src/lib/tema/derivar-tokens.ts: de 2 colores de marca a todo el tema.
// Los neutros son de croma 0 (como [data-tema="tienda"] de la web) y dependen del `modo` FIJO de la marca.
import { textoSobre } from './color';
import type { MarcaPublica, RadioMarca } from './marca.types';
import { SEMANTICOS, type TemaResuelto } from './tokens';

/** RECTO 4 · SUAVE 12 · REDONDO 20 (px), spec §7.2. */
export const RADIO_PX: Record<RadioMarca, number> = { RECTO: 4, SUAVE: 12, REDONDO: 20 };

const NEUTROS_CLARO = {
  background: '#FFFFFF', foreground: '#0A0A0A', card: '#FFFFFF', 'card-foreground': '#0A0A0A',
  popover: '#FFFFFF', 'popover-foreground': '#0A0A0A', secondary: '#F5F5F5', 'secondary-foreground': '#171717',
  muted: '#F5F5F5', 'muted-foreground': '#737373', accent: '#F5F5F5', 'accent-foreground': '#171717',
  destructive: '#BE123C', 'destructive-foreground': '#FFFFFF', border: '#E5E5E5', input: '#E5E5E5',
};

const NEUTROS_OSCURO = {
  background: '#0A0A0A', foreground: '#FAFAFA', card: '#171717', 'card-foreground': '#FAFAFA',
  popover: '#171717', 'popover-foreground': '#FAFAFA', secondary: '#262626', 'secondary-foreground': '#FAFAFA',
  muted: '#262626', 'muted-foreground': '#A1A1A1', accent: '#262626', 'accent-foreground': '#FAFAFA',
  destructive: '#FB7185', 'destructive-foreground': '#0A0A0A', border: '#2A2A2A', input: '#333333',
};

type MarcaTokens = Pick<MarcaPublica, 'colorPrimario' | 'colorAcento' | 'radio' | 'modo'>;

export function derivarTemaTienda(marca: MarcaTokens): TemaResuelto {
  const oscuro = marca.modo === 'OSCURO';
  return {
    oscuro,
    radio: RADIO_PX[marca.radio] ?? RADIO_PX.SUAVE,
    colores: {
      ...(oscuro ? NEUTROS_OSCURO : NEUTROS_CLARO),
      ...(oscuro ? SEMANTICOS.oscuro : SEMANTICOS.claro),
      primary: marca.colorPrimario,
      'primary-foreground': textoSobre(marca.colorPrimario),
      ring: marca.colorPrimario,
      'brand-accent': marca.colorAcento,
      'brand-accent-foreground': textoSobre(marca.colorAcento),
    },
  };
}
