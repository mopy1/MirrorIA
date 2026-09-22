import { useSharedValue } from 'react-native-reanimated';
import { useFrameOutput } from 'react-native-vision-camera';
import { mirroriaPoseDetector } from 'mirroria-pose-detector';
import type { PoseLandmark } from '../types/pose.types';

/** Corre la detección de pose 1 de cada N frames — la cámara sigue fluida a
 * su FPS normal, pero ML Kit (bloqueante, ~200ms de timeout) solo se llama
 * a una fracción de eso. Bajar este número si el teléfono aguanta más. */
const PROCESS_EVERY_N_FRAMES = 3;

/**
 * Conecta el plugin nativo de pose (`mirroria-pose-detector`) al frame de
 * la cámara. Devuelve `frameOutput` para pasarle a `<Camera outputs={...}>`,
 * `landmarks` (shared value de Reanimated, actualizado por el worklet sin
 * pasar por React) y `processedFrames` (contador, para medir FPS real desde
 * afuera sin tocar el hilo de la cámara).
 */
export function usePoseLandmarks() {
  const landmarks = useSharedValue<PoseLandmark[]>([]);
  const frameCounter = useSharedValue(0);
  const processedFrames = useSharedValue(0);

  const frameOutput = useFrameOutput({
    // ML Kit necesita acceso CPU al buffer en YUV/JPEG — el default de
    // VisionCamera es 'native' (GPU-only, cero copia), que ML Kit rechaza
    // con "Only JPEG and YUV_420_888 are supported now".
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet';
      frameCounter.value += 1;
      if (frameCounter.value % PROCESS_EVERY_N_FRAMES !== 0) {
        frame.dispose();
        return;
      }

      mirroriaPoseDetector.processFrameAndroid(frame);
      landmarks.value = mirroriaPoseDetector.landmarks;
      processedFrames.value += 1;

      frame.dispose();
    },
  });

  return { frameOutput, landmarks, processedFrames };
}
