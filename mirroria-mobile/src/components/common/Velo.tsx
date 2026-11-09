import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Velo oscuro para leer texto sobre una foto (no es decoración): `abajo` oscurece
 * el pie (títulos del hero), `arriba` oscurece la franja de la barra de estado.
 */
export function Velo({ opacidad = 0.75, desde = 'abajo' }: { opacidad?: number; desde?: 'abajo' | 'arriba' }) {
  const id = `velo-${desde}`;
  const abajo = desde === 'abajo';
  return (
    <Svg style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1={abajo ? '0' : '1'} x2="0" y2={abajo ? '1' : '0'}>
          <Stop offset={abajo ? '0.25' : '0'} stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity={opacidad} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
