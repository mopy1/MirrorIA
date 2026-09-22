import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { OVERLAY_LANDMARKS, type PoseLandmark } from '../../types/pose.types';
import { PoseDot } from './PoseDot';

interface PoseOverlayProps {
  landmarks: SharedValue<PoseLandmark[]>;
  processedFrames: SharedValue<number>;
  mirrored: boolean;
  /** Tamaño del contenedor de cámara — lo mide `CameraStage` una sola vez y
   * lo comparte con `GarmentOverlay`, para que ambos usen el mismo marco de
   * referencia de píxeles. */
  containerWidth: number;
  containerHeight: number;
  /** Solo development: badge de FPS de detección — no aparece en producción. */
  showDebugBadge?: boolean;
}

/** Dibuja los puntos de pose sobre la cámara. */
export function PoseOverlay({
  landmarks,
  processedFrames,
  mirrored,
  containerWidth,
  containerHeight,
  showDebugBadge = __DEV__,
}: PoseOverlayProps) {
  const [fps, setFps] = useState(0);
  const lastCount = useRef(0);

  useEffect(() => {
    if (!showDebugBadge) return;
    const id = setInterval(() => {
      const current = processedFrames.value;
      setFps(current - lastCount.current);
      lastCount.current = current;
    }, 1000);
    return () => clearInterval(id);
  }, [processedFrames, showDebugBadge]);

  if (containerWidth === 0) return null;

  return (
    <>
      {OVERLAY_LANDMARKS.map((name) => (
        <PoseDot
          key={name}
          name={name}
          landmarks={landmarks}
          width={containerWidth}
          height={containerHeight}
          mirrored={mirrored}
          color="#ffffff"
        />
      ))}

      {showDebugBadge && (
        <View className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50">
          <Text className="text-[10px] font-semibold text-white">
            Pose: {fps} fps
          </Text>
        </View>
      )}
    </>
  );
}
