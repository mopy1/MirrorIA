import * as React from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * La vitrina pinta la foto debajo de la barra de estado: íconos claros sobre la foto y,
 * al bajar del hero, una franja con el fondo de la marca y los íconos del modo.
 */
export function useBarraEstadoVitrina(alturaHero: number) {
  const [pasado, setPasado] = React.useState(false);
  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const debajo = e.nativeEvent.contentOffset.y > alturaHero - 40;
      setPasado((antes) => (antes === debajo ? antes : debajo));
    },
    [alturaHero],
  );
  return { pasado, onScroll };
}
