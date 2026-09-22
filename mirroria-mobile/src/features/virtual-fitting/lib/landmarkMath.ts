import type { PoseLandmark } from '../types/pose.types';
import { MIN_VISIBILITY } from '../types/pose.types';

/** Describe, para una imagen de prenda dada, qué punto suyo corresponde al
 * punto medio real de hombros y qué ancho suyo corresponde al ancho real de
 * hombros — así el mismo código sirve para cualquier PNG sin hardcodear
 * proporciones por prenda. Todo en fracciones 0-1 del tamaño de la imagen. */
export interface GarmentAnchor {
  shoulderWidthFraction: number;
  anchorX: number;
  anchorY: number;
}

export interface GarmentTransform {
  visible: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
  rotationDeg: number;
}

/**
 * Ancho de hombros → escala, punto medio de hombros → posición, ángulo de
 * la línea de hombros → rotación. Pura y marcada `'worklet'` a propósito:
 * se llama desde dentro de un `useAnimatedStyle` (hilo de UI), no desde
 * React — por eso recibe los dos landmarks ya resueltos en vez de todo el
 * array + un índice.
 */
export function computeGarmentTransform(
  leftShoulder: PoseLandmark | undefined,
  rightShoulder: PoseLandmark | undefined,
  containerWidth: number,
  containerHeight: number,
  mirrored: boolean,
  imageWidth: number,
  imageHeight: number,
  anchor: GarmentAnchor,
): GarmentTransform {
  'worklet';
  const hidden: GarmentTransform = {
    visible: false,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    rotationDeg: 0,
  };

  if (!leftShoulder || !rightShoulder) return hidden;
  if (
    leftShoulder.visibility < MIN_VISIBILITY ||
    rightShoulder.visibility < MIN_VISIBILITY
  ) {
    return hidden;
  }

  // Mismo criterio que PoseDot: el frame crudo no está espejado, pero el
  // preview de la cámara frontal sí — se espeja acá para que la prenda
  // caiga en el mismo lugar que ve la clienta en pantalla.
  const leftX = (mirrored ? 1 - leftShoulder.x : leftShoulder.x) * containerWidth;
  const rightX = (mirrored ? 1 - rightShoulder.x : rightShoulder.x) * containerWidth;
  const leftY = leftShoulder.y * containerHeight;
  const rightY = rightShoulder.y * containerHeight;

  const shoulderWidthPx = Math.hypot(rightX - leftX, rightY - leftY);
  const midX = (leftX + rightX) / 2;
  const midY = (leftY + rightY) / 2;

  const scale = shoulderWidthPx / (imageWidth * anchor.shoulderWidthFraction);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  const left = midX - anchor.anchorX * width;
  const top = midY - anchor.anchorY * height;

  // atan2 en vez de espejar por separado: con el signo de (leftX - rightX)
  // el ángulo ya sale correcto tanto espejado como no.
  const rotationRad = Math.atan2(leftY - rightY, leftX - rightX) - Math.PI;
  const rotationDeg = (rotationRad * 180) / Math.PI;

  return { visible: true, left, top, width, height, rotationDeg };
}
