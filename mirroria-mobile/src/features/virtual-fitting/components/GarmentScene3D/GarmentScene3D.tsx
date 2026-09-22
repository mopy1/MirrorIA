import React from 'react';
import { Canvas } from '@react-three/fiber';
import type { SharedValue } from 'react-native-reanimated';
import { GarmentModel } from './GarmentModel';
import type { PoseLandmark } from '../../types/pose.types';

interface GarmentScene3DProps {
  source: number;
  containerWidth: number;
  containerHeight: number;
  mirrored: boolean;
  landmarks: SharedValue<PoseLandmark[]>;
}

/**
 * Cámara ortográfica mapeada 1:1 a píxeles del contenedor (world unit =
 * pixel, origen en el centro) — así, el seguimiento del cuerpo (ver
 * `GarmentModel`) mueve el modelo a una coordenada de pantalla directo, sin
 * conversiones de perspectiva.
 */
export function GarmentScene3D({
  source,
  containerWidth,
  containerHeight,
  mirrored,
  landmarks,
}: GarmentScene3DProps) {
  return (
    <Canvas
      style={{ position: 'absolute', width: containerWidth, height: containerHeight }}
      orthographic
      camera={{
        left: -containerWidth / 2,
        right: containerWidth / 2,
        top: containerHeight / 2,
        bottom: -containerHeight / 2,
        near: 0.1,
        far: 1000,
        position: [0, 0, 100],
      }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 5]} intensity={1.3} />
      <GarmentModel
        source={source}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        mirrored={mirrored}
        landmarks={landmarks}
      />
    </Canvas>
  );
}
