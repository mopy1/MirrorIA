import { useEffect, useRef, useState } from 'react';
import { mediaDevices, type MediaStream } from '@livekit/react-native-webrtc';

export type EstadoCamara = 'apagada' | 'pidiendo' | 'lista' | 'sin-permiso';
export type Lado = 'user' | 'environment';

/**
 * Abre la cámara como `MediaStream` de WebRTC (lo que Decart necesita para
 * publicar el video). `getUserMedia` ya pide el permiso de cámara de Android
 * si falta, así que no hace falta un hook de permisos aparte.
 *
 * Cambiar de cámara abre un stream nuevo: la sesión de Decart se rearma sola
 * porque `useProbadorIA` depende del stream. Con `encendida: false` no hay
 * stream, y sin stream no hay sesión de Decart (no se gasta crédito).
 */
export function useCamaraLocal(encendida: boolean, lado: Lado, intento: number) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [estado, setEstado] = useState<EstadoCamara>('apagada');
  const vivo = useRef(true);

  useEffect(() => {
    if (!encendida) {
      setEstado('apagada');
      return;
    }
    vivo.current = true;
    let actual: MediaStream | null = null;
    setEstado('pidiendo');

    mediaDevices
      .getUserMedia({
        audio: false,
        video: { facingMode: lado, width: 1280, height: 720, frameRate: 20 },
      })
      .then((s) => {
        if (!vivo.current) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        actual = s;
        setStream(s);
        setEstado('lista');
      })
      .catch(() => {
        if (vivo.current) setEstado('sin-permiso');
      });

    return () => {
      vivo.current = false;
      actual?.getTracks().forEach((t) => t.stop());
      actual?.release();
      setStream(null);
    };
  }, [encendida, lado, intento]);

  return { stream, estado };
}
