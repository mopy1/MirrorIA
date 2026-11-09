import { mediaDevices, type MediaStream } from '@livekit/react-native-webrtc';
import { models, resolveFpsNumber } from '@decartai/sdk';
import { useCameraPermissions } from 'expo-camera';
import * as React from 'react';
import type { EstadoCamara, PermisoCamara } from '@/lib/probador/fase-probador';

export const MODELO_VTON = models.realtime('lucy-vton-3.5');

/**
 * Cámara frontal a los fps y tamaño del modelo (README de Decart, "React Native / Expo").
 * Solo abre la cámara mientras `activo` (pantalla enfocada y probador encendido) y la apaga al salir.
 */
export function useCamaraFrontal(activo: boolean) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [fallo, setFallo] = React.useState(false);
  const [intento, setIntento] = React.useState(0);
  const concedido = !!permiso?.granted;
  const encendida = activo && concedido;

  // Al encender, si nunca se preguntó, se pide el permiso (la pantalla ya explicó para qué).
  React.useEffect(() => {
    if (activo && permiso && !permiso.granted && permiso.canAskAgain && permiso.status === 'undetermined') void pedirPermiso();
  }, [activo, permiso, pedirPermiso]);

  React.useEffect(() => {
    if (!encendida) return;
    let vivo = true;
    let actual: MediaStream | null = null;
    mediaDevices
      .getUserMedia({
        audio: false,
        video: { facingMode: 'user', frameRate: resolveFpsNumber(MODELO_VTON.fps), width: MODELO_VTON.width, height: MODELO_VTON.height },
      })
      .then((s) => {
        if (!vivo) return s.release();
        actual = s;
        setStream(s);
      })
      .catch(() => vivo && setFallo(true));
    return () => {
      vivo = false;
      actual?.release();
      setStream(null);
    };
  }, [encendida, intento]);

  let estado: EstadoCamara = 'apagada';
  if (encendida) estado = fallo ? 'error' : stream ? 'lista' : 'abriendo';
  const reintentar = React.useCallback(() => {
    setFallo(false);
    setIntento((n) => n + 1);
  }, []);

  let estadoPermiso: PermisoCamara = 'desconocido';
  if (permiso?.granted) estadoPermiso = 'concedido';
  else if (permiso && permiso.status === 'denied') estadoPermiso = permiso.canAskAgain ? 'negado' : 'negado-siempre';

  return { stream: encendida ? stream : null, estado, permiso: estadoPermiso, pedirPermiso, reintentar };
}
