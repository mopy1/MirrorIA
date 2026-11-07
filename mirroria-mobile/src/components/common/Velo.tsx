import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Velo oscuro de abajo hacia arriba para leer texto sobre una foto (no es decoración). */
export function Velo({ opacidad = 0.75 }: { opacidad?: number }) {
  return (
    <Svg style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }} pointerEvents="none">
      <Defs>
        <LinearGradient id="velo" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.25" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity={opacidad} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#velo)" />
    </Svg>
  );
}
