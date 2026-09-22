import { type HybridObject, NitroModules } from 'react-native-nitro-modules';
import { type Frame } from 'react-native-vision-camera';

/**
 * Un punto de referencia del cuerpo (0-32, esquema de 33 puntos de
 * MediaPipe/BlazePose — ver `pose.types.ts` del lado JS para los nombres).
 * `x`/`y` normalizados 0-1 contra el tamaño real del frame; `z` en la misma
 * escala relativa que ML Kit devuelve (profundidad relativa a la cadera,
 * no una unidad física); `visibility` 0-1, confianza de que el punto es
 * visible (no está tapado).
 */
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface MirroriaPoseDetector
  extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  /**
   * Corre la detección de pose de ML Kit sobre el frame (bloqueante, con
   * timeout corto) y actualiza `landmarks`. Se llama desde un worklet en
   * cada frame de cámara — nunca disparar sin `'worklet'` en el callback.
   */
  processFrameAndroid(frame: Frame): void;
  /** No implementado todavía — el probador AR es Android-first (ver plan). */
  processFrameIOS(frame: Frame): void;

  /** Los 33 puntos de la última detección exitosa, o `[]` si no hay cuerpo. */
  readonly landmarks: PoseLandmark[];
}

export const mirroriaPoseDetector =
  NitroModules.createHybridObject<MirroriaPoseDetector>('MirroriaPoseDetector');
