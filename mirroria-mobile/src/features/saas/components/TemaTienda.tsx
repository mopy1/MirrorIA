import React, { useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { vars } from 'nativewind';
import { hexAHslVar } from '../../appearance/lib/color';
import { useMarcaTienda } from '../hooks/useMarcaTienda';

/**
 * Pinta la app con el color principal de la tienda actual: solo cambia las
 * variables `--primary` y `--ring` que ya usan todas las clases de NativeWind
 * (botones, enlaces, íconos activos). El color llega ya ajustado para leerse
 * sobre blanco (la app va siempre en modo claro). Sin marca, queda el de siempre.
 */
export function TemaTienda({ children }: { children: React.ReactNode }) {
  const { marca } = useMarcaTienda();
  const hsl = marca?.colorPrimario ? hexAHslVar(marca.colorPrimario) : null;

  // En la web los modales se dibujan fuera de este View: la variable va en la raíz del documento.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const raiz = document.documentElement.style;
    if (hsl) {
      raiz.setProperty('--primary', hsl);
      raiz.setProperty('--ring', hsl);
    } else {
      raiz.removeProperty('--primary');
      raiz.removeProperty('--ring');
    }
  }, [hsl]);

  const estilo = useMemo(() => (hsl ? vars({ '--primary': hsl, '--ring': hsl }) : undefined), [hsl]);
  return <View style={[{ flex: 1 }, estilo]}>{children}</View>;
}
