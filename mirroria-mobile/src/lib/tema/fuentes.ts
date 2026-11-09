import { BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import type { FuenteMarca } from './marca.types';

/** Todas las familias de la app (pocos pesos: nunca más de dos por pantalla). */
export const FUENTES_APP = {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  GeistMono_500Medium,
  Outfit_600SemiBold,
  DMSans_600SemiBold,
  PlayfairDisplay_600SemiBold,
};

/** Títulos de la plataforma MirrorIA. */
export const FAMILIA_PLATAFORMA = 'BricolageGrotesque_700Bold';

/** Fuente de títulos por marca (`geist` → Bricolage, como la web). */
export const FAMILIA_TITULOS: Record<FuenteMarca, string> = {
  geist: 'BricolageGrotesque_600SemiBold',
  outfit: 'Outfit_600SemiBold',
  'dm-sans': 'DMSans_600SemiBold',
  playfair: 'PlayfairDisplay_600SemiBold',
};
