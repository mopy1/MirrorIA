import { createDecartClient, type RealTimeClient } from '@decartai/sdk';
import type { MediaStream } from '@livekit/react-native-webrtc';
import * as React from 'react';
import { ApiError, ErrorSinRed } from '@/lib/api/errores';
import { urlImagen } from '@/lib/config';
import type { EstadoSesion } from '@/lib/probador/fase-probador';
import { promptDePrenda, type PrendaProbable } from '@/lib/probador/prendas';
import { obtenerTokenProbador } from '../api/probador.api';
import { MODELO_VTON } from './use-camara-frontal';

function entradaDe(p: PrendaProbable) {
  return { prompt: promptDePrenda(p), image: urlImagen(p.imagen) ?? undefined };
}

function mensajeConexion(e: unknown): string {
  if (e instanceof ApiError && e.status === 429) return e.message;
  if (e instanceof ApiError && e.status === 503) return 'El probador no está disponible en esta tienda ahora.';
  if (e instanceof ErrorSinRed) return 'No hay conexión con la tienda para encender el probador.';
  return 'No pudimos conectar con la IA. Probá de nuevo en un momento.';
}

/** Resultado de UNA conexión (stream + intento): lo viejo se ignora sin tener que limpiarlo a mano. */
interface Resultado {
  stream: MediaStream;
  intento: number;
  estado: 'en-vivo' | 'error';
  remoto: MediaStream | null;
  error: string | null;
}

/**
 * Una sesión `lucy-vton-3.5` por cámara abierta (como `useProbadorIA` de la web): el token efímero se pide
 * justo antes de conectar; cambiar de prenda es un `set()` sobre la misma conexión, no una reconexión.
 */
export function useSesionDecart(stream: MediaStream | null, prenda: PrendaProbable | null) {
  const [res, setRes] = React.useState<Resultado | null>(null);
  const [avisoPrenda, setAvisoPrenda] = React.useState<string | null>(null);
  const [intento, setIntento] = React.useState(0);
  const cliente = React.useRef<RealTimeClient | null>(null);
  const prendaRef = React.useRef(prenda);
  const aplicada = React.useRef<string | null>(null);
  React.useEffect(() => {
    prendaRef.current = prenda;
  }, [prenda]);

  React.useEffect(() => {
    if (!stream) return;
    let vivo = true;
    const guardar = (r: Partial<Resultado>) =>
      vivo && setRes((a) => ({ stream, intento, estado: 'en-vivo', remoto: a?.stream === stream && a.intento === intento ? a.remoto : null, error: null, ...r }));
    const inicial = prendaRef.current;
    aplicada.current = inicial?.id ?? null;
    const e = inicial ? entradaDe(inicial) : null;
    obtenerTokenProbador()
      .then(({ apiKey }) =>
        vivo
          ? createDecartClient({ apiKey }).realtime.connect(stream, {
              model: MODELO_VTON,
              preferredVideoCodec: 'vp8',
              initialState: e ? { prompt: { text: e.prompt, enhance: false }, image: e.image } : undefined,
              onRemoteStream: (s) => guardar({ remoto: s }),
              onConnectionChange: (s) => {
                if (s === 'connected' || s === 'generating') guardar({});
                else if (s === 'disconnected') guardar({ estado: 'error', error: 'Se cortó la conexión con la IA.' });
              },
            })
          : null,
      )
      .then((rt) => {
        if (rt && !vivo) rt.disconnect();
        else if (rt) cliente.current = rt;
      })
      .catch((err: unknown) => guardar({ estado: 'error', error: mensajeConexion(err) }));
    return () => {
      vivo = false;
      cliente.current?.disconnect();
      cliente.current = null;
    };
  }, [stream, intento]);

  const actual = stream && res?.stream === stream && res.intento === intento ? res : null;
  const estado: EstadoSesion = !stream ? 'inactiva' : (actual?.estado ?? 'conectando');

  // Cambio de prenda con la sesión ya conectada: misma conexión, nuevo prompt + foto.
  React.useEffect(() => {
    const rt = cliente.current;
    if (!rt || estado !== 'en-vivo' || !prenda || aplicada.current === prenda.id) return;
    aplicada.current = prenda.id;
    rt.set({ ...entradaDe(prenda), enhance: false })
      .then(() => setAvisoPrenda(null))
      .catch(() => setAvisoPrenda('Esa prenda no se pudo cargar. Probá con otra.'));
  }, [prenda, estado]);

  const reintentar = React.useCallback(() => setIntento((n) => n + 1), []);
  return { remoto: actual?.remoto ?? null, estado, error: actual?.error ?? avisoPrenda, reintentar };
}
