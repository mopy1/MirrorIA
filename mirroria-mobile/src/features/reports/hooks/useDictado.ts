import { useRef, useState } from 'react';
import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

const MENSAJES_ERROR: Record<string, string> = {
  'not-allowed':
    Platform.OS === 'web'
      ? 'Sin permiso de micrófono no puedo escucharte. Activalo en el candado de la barra de direcciones del navegador o escribí la pregunta.'
      : 'Sin permiso de micrófono no puedo escucharte. Podés activarlo en los ajustes del teléfono o escribir la pregunta.',
  'service-not-allowed': 'El dictado por voz no está disponible en este teléfono. Escribí la pregunta.',
  'no-speech': 'No se escuchó nada. Probá hablar más fuerte o más cerca del micrófono.',
  'speech-timeout': 'No se escuchó nada. Probá hablar más fuerte o más cerca del micrófono.',
  'audio-capture': 'No se encontró un micrófono disponible.',
  network: 'Falló la conexión necesaria para pasar la voz a texto. Revisá tu internet.',
  'language-not-supported': 'Este teléfono no reconoce el español para dictar. Escribí la pregunta.',
  busy: 'El micrófono está ocupado por otra app. Cerrala y probá de nuevo.',
};

export const NO_DISPONIBLE = 'El dictado por voz no está disponible en este dispositivo o navegador. Escribí la pregunta.';

/** En web, expo-speech-recognition siempre dice "concedido": se consulta el permiso real del navegador. */
async function estadoPermisoWeb(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    const r = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return r.state;
  } catch {
    return 'prompt';
  }
}

function reconocimientoDisponible(): boolean {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

/**
 * Dictado con `expo-speech-recognition` (en web usa la Web Speech API del navegador).
 * Como en la web: la voz se pasa a texto en el dispositivo, el backend recibe solo texto.
 * Antes de pedir el permiso del sistema se muestra un aviso propio (`avisoPermiso`) que explica para qué es.
 */
export function useDictado({ onTextoFinal, onTextoParcial }: { onTextoFinal: (t: string) => void; onTextoParcial: (t: string) => void }) {
  const [escuchando, setEscuchando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoPermiso, setAvisoPermiso] = useState(false);
  const acumulado = useRef('');
  const disponible = reconocimientoDisponible();

  useSpeechRecognitionEvent('start', () => {
    acumulado.current = '';
    setEscuchando(true);
  });
  useSpeechRecognitionEvent('result', (e) => {
    const texto = e.results[0]?.transcript ?? '';
    if (e.isFinal) {
      acumulado.current = `${acumulado.current} ${texto}`.trim();
      onTextoParcial(acumulado.current);
    } else {
      onTextoParcial(`${acumulado.current} ${texto}`.trim());
    }
  });
  useSpeechRecognitionEvent('end', () => {
    setEscuchando(false);
    // Recién al terminar se manda: una pausa a mitad de la frase no corta la pregunta.
    if (acumulado.current) onTextoFinal(acumulado.current);
    acumulado.current = '';
  });
  useSpeechRecognitionEvent('error', (e) => {
    setEscuchando(false);
    if (e.error === 'aborted') return;
    setError(MENSAJES_ERROR[e.error] ?? `No se pudo dictar (${e.message || e.error}).`);
  });

  function arrancar() {
    setError(null);
    ExpoSpeechRecognitionModule.start({ lang: 'es-ES', interimResults: true, continuous: true });
  }

  /** Primer toque al micrófono: si falta el permiso, muestra el aviso; si ya está, escucha. */
  async function alternar() {
    if (escuchando) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    if (!disponible) {
      setError(NO_DISPONIBLE);
      return;
    }
    if (Platform.OS === 'web') {
      const estado = await estadoPermisoWeb();
      if (estado === 'granted') arrancar();
      else if (estado === 'denied') setError(MENSAJES_ERROR['not-allowed']);
      else setAvisoPermiso(true);
      return;
    }
    try {
      const permiso = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      if (permiso.granted) arrancar();
      else if (!permiso.canAskAgain) setError(MENSAJES_ERROR['not-allowed']);
      else setAvisoPermiso(true);
    } catch {
      setAvisoPermiso(true);
    }
  }

  /** "Permitir micrófono" en el aviso propio: recién ahí se abre el diálogo del sistema. */
  async function aceptarPermiso() {
    setAvisoPermiso(false);
    // En web el propio navegador pide el permiso al arrancar.
    if (Platform.OS === 'web') return arrancar();
    try {
      const permiso = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (permiso.granted) arrancar();
      else setError(MENSAJES_ERROR['not-allowed']);
    } catch {
      setError(NO_DISPONIBLE);
    }
  }

  return { disponible, escuchando, error, avisoPermiso, alternar, aceptarPermiso, cancelarPermiso: () => setAvisoPermiso(false) };
}
