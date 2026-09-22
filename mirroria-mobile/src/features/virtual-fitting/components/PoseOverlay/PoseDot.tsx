import React from 'react';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import {
  MIN_VISIBILITY,
  POSE_LANDMARK_INDEX,
  type PoseLandmark,
  type PoseLandmarkName,
} from '../../types/pose.types';

const DOT_SIZE = 14;

interface PoseDotProps {
  landmarks: SharedValue<PoseLandmark[]>;
  name: PoseLandmarkName;
  width: number;
  height: number;
  /** Cámara frontal muestra el preview espejado; el frame crudo no lo está. */
  mirrored: boolean;
  color: string;
}

/**
 * Un punto individual del overlay, animado por Reanimated directo desde el
 * shared value — no pasa por React en cada frame, solo por el hilo de UI.
 * `View` nativa lisa (no SVG): `react-native-svg` no se capturaba en las
 * fotos de `react-native-view-shot`, aunque se veía bien en pantalla en
 * vivo — una `View` con `borderRadius` sí participa del draw path normal
 * de Android y se captura siempre.
 */
export function PoseDot({
  landmarks,
  name,
  width,
  height,
  mirrored,
  color,
}: PoseDotProps) {
  const index = POSE_LANDMARK_INDEX[name];

  const animatedStyle = useAnimatedStyle(() => {
    const point = landmarks.value[index];
    const visible = Boolean(point) && point.visibility >= MIN_VISIBILITY;
    const x = point ? (mirrored ? 1 - point.x : point.x) * width : 0;
    const y = point ? point.y * height : 0;

    return {
      opacity: visible ? 1 : 0,
      transform: [
        { translateX: x - DOT_SIZE / 2 },
        { translateY: y - DOT_SIZE / 2 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}
