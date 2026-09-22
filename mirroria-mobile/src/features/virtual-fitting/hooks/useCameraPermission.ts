import { useEffect } from 'react';
import { useCameraPermission as useVisionCameraPermission } from 'react-native-vision-camera';

/**
 * Pide el permiso de cámara automáticamente al montar, si todavía no fue
 * otorgado ni definitivamente denegado. Envuelve el hook de VisionCamera
 * para que el resto de la feature no dependa directo de esa librería.
 */
export function useCameraPermission() {
  const { hasPermission, canRequestPermission, requestPermission } =
    useVisionCameraPermission();

  useEffect(() => {
    if (!hasPermission && canRequestPermission) {
      requestPermission();
    }
  }, [hasPermission, canRequestPermission, requestPermission]);

  return { hasPermission, canRequestPermission, requestPermission };
}
