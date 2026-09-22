import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { computeGarmentTransform, type GarmentAnchor } from '../../lib/landmarkMath';
import { POSE_LANDMARK_INDEX, type PoseLandmark } from '../../types/pose.types';

interface GarmentOverlayProps {
  landmarks: SharedValue<PoseLandmark[]>;
  containerWidth: number;
  containerHeight: number;
  mirrored: boolean;
  source: ImageSourcePropType;
  imageWidth: number;
  imageHeight: number;
  anchor: GarmentAnchor;
}

/**
 * Sprite 2D de la prenda, reposicionado/escalado/rotado en el hilo de UI
 * (Reanimated) según la distancia y el ángulo entre hombros — sin pasar por
 * React en cada frame. Primera pasada de la Fase 3: PNG plano, no 3D
 * (Three.js queda para la Fase 5 si esto no alcanza visualmente).
 */
export function GarmentOverlay({
  landmarks,
  containerWidth,
  containerHeight,
  mirrored,
  source,
  imageWidth,
  imageHeight,
  anchor,
}: GarmentOverlayProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const left = landmarks.value[POSE_LANDMARK_INDEX.LEFT_SHOULDER];
    const right = landmarks.value[POSE_LANDMARK_INDEX.RIGHT_SHOULDER];
    const t = computeGarmentTransform(
      left,
      right,
      containerWidth,
      containerHeight,
      mirrored,
      imageWidth,
      imageHeight,
      anchor,
    );

    return {
      opacity: t.visible ? 0.92 : 0,
      left: t.left,
      top: t.top,
      width: t.width,
      height: t.height,
      transform: [{ rotate: `${t.rotationDeg}deg` }],
    };
  });

  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={[{ position: 'absolute' }, animatedStyle]}
    />
  );
}
