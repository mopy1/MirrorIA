import { useCallback, useEffect, useRef, useState } from 'react';
import { createDecartClient, models, type RealTimeClient } from '@decartai/sdk';
import type { MediaStream } from '@livekit/react-native-webrtc';
import { probadorApi } from '../api/probadorApi';

export type EstadoIA = 'inactivo' | 'conectando' | 'conectado' | 'error';

const MODELO = models.realtime('lucy-vton-3.5');

/**
 * Publica la cámara en Decart (VTON, RF13) y expone la URL del stream ya
 * vestido por la IA, lista para un `<RTCView streamURL>`. Mismo flujo que el
 * `useProbadorIA` de la web: un solo `RealTimeClient` por stream de cámara y
 * cambiar de prenda es un `set()` sobre esa conexión, no reconectar.
 *
 * En React Native el SDK no espeja el video saliente (`mirror` tiene que ir en
 * `false`), el espejo de la cámara frontal se hace al dibujar (`RTCView mirror`).
 */
export function useProbadorIA(stream: MediaStream | null) {
  const [remotoUrl, setRemotoUrl] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoIA>('inactivo');
  const cliente = useRef<RealTimeClient | null>(null);

  useEffect(() => {
    let vivo = true;
    setRemotoUrl(null);
    if (!stream) {
      setEstado('inactivo');
      return;
    }

    setEstado('conectando');
    probadorApi
      .obtenerToken()
      .then(({ apiKey }) => {
        if (!vivo) return null;
        return createDecartClient({ apiKey }).realtime.connect(stream as never, {
          model: MODELO,
          mirror: false,
          onRemoteStream: (remoto) => {
            if (vivo) setRemotoUrl((remoto as unknown as MediaStream).toURL());
          },
          onConnectionChange: (s) => {
            if (!vivo) return;
            if (s === 'connected' || s === 'generating') setEstado('conectado');
            else if (s === 'disconnected') setEstado('error');
          },
        });
      })
      .then((rt) => {
        if (!rt) return;
        if (!vivo) {
          rt.disconnect();
          return;
        }
        cliente.current = rt;
      })
      .catch((err) => {
        console.error('[Probador] No se pudo conectar con Decart:', err);
        if (vivo) setEstado('error');
      });

    return () => {
      vivo = false;
      cliente.current?.disconnect();
      cliente.current = null;
    };
  }, [stream]);

  // El SDK descarga la foto (URL https) y se la manda a la sesión conectada.
  // Devuelve `false` si todavía no hay conexión. Si la sesión ya no acepta
  // mensajes (se vio en el celular: "WebSocket is not open" con la
  // señalización de Decart cerrada), se marca error para ofrecer reconectar.
  const probarPrenda = useCallback(async (imagenUrl: string, prompt: string) => {
    const rt = cliente.current;
    if (!rt) return false;
    try {
      await rt.set({ prompt, image: imagenUrl, enhance: false });
      return true;
    } catch (err) {
      console.error('[Probador] Decart rechazó la prenda:', err);
      setEstado('error');
      return false;
    }
  }, []);

  return { remotoUrl, estado, probarPrenda };
}
