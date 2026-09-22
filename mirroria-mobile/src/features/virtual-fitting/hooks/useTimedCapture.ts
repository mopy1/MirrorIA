import { useState } from 'react';

/** Segundos de cuenta regresiva antes de disparar — 0 = sin temporizador. */
export const TIMER_OPTIONS = [0, 3, 5, 10] as const;

/**
 * Maneja el temporizador + disparo de captura para pruebas donde no hay
 * nadie más para sostener el teléfono (autorretrato). `capturePhoto` es
 * quien realmente saca la foto y devuelve una URI — acá vive el
 * temporizador y el estado de revisión, no el mecanismo de captura en sí
 * (hoy es un screenshot de la vista vía `react-native-view-shot`, para que
 * incluya los puntos de pose dibujados encima; la foto nativa de la cámara
 * no los tendría, son una capa de React aparte).
 */
export function useTimedCapture(capturePhoto: () => Promise<string>) {
  const [timerIndex, setTimerIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const timerSeconds = TIMER_OPTIONS[timerIndex];

  const cycleTimer = () =>
    setTimerIndex((i) => (i + 1) % TIMER_OPTIONS.length);

  const capture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCaptureError(null);
    try {
      for (let s = timerSeconds; s > 0; s--) {
        setCountdown(s);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setCountdown(null);

      const uri = await capturePhoto();
      setPhotoPath(uri);
    } catch (err) {
      // `captureScreen()` rechaza en varios fabricantes y siempre que hay
      // una superficie con flag de seguridad en pantalla. Sin este catch
      // quedaba una promesa rechazada sin manejar y, de cara a la clienta,
      // el botón de disparo simplemente no hacía nada.
      setCaptureError(err instanceof Error ? err.message : String(err));
      setCountdown(null);
    } finally {
      setIsCapturing(false);
    }
  };

  const closeReview = () => setPhotoPath(null);

  return {
    timerSeconds,
    cycleTimer,
    countdown,
    isCapturing,
    capture,
    photoPath,
    closeReview,
    captureError,
    dismissCaptureError: () => setCaptureError(null),
  };
}
