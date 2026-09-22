export type { PoseLandmark } from 'mirroria-pose-detector';

/** Índices fijos 0-32, esquema MediaPipe/BlazePose — así los devuelve el
 * módulo nativo (`modules/mirroria-pose-detector`). Solo se nombran acá los
 * que usa el overlay hoy; el resto sigue disponible por índice crudo. */
export const POSE_LANDMARK_INDEX = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

export type PoseLandmarkName = keyof typeof POSE_LANDMARK_INDEX;

/** Puntos que dibuja el overlay de la Fase 2 — hombros, codos, muñecas,
 * caderas, rodillas y tobillos, tal como pide el hito de esta fase. */
export const OVERLAY_LANDMARKS: PoseLandmarkName[] = [
  'LEFT_SHOULDER',
  'RIGHT_SHOULDER',
  'LEFT_ELBOW',
  'RIGHT_ELBOW',
  'LEFT_WRIST',
  'RIGHT_WRIST',
  'LEFT_HIP',
  'RIGHT_HIP',
  'LEFT_KNEE',
  'RIGHT_KNEE',
  'LEFT_ANKLE',
  'RIGHT_ANKLE',
];

/** Por debajo de esto, ML Kit no está seguro de que el punto sea visible
 * (tapado, fuera de cuadro) — se oculta en vez de dibujar un punto falso. */
export const MIN_VISIBILITY = 0.5;
