import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useIsFocused } from 'expo-router';

/**
 * Cuándo la cámara debe estar realmente encendida.
 *
 * `<Camera isActive>` estaba fijo en `true`: como las pestañas quedan
 * MONTADAS al cambiar de una a otra, abrir el Vestidor y volver a Inicio
 * dejaba corriendo la cámara, el detector de pose de ML Kit y el bucle de
 * `useFrame` de three.js — quemando batería sin que nada se vea. Lo mismo
 * con la app en segundo plano.
 */
export function useCameraActive() {
  const focused = useIsFocused();
  const [appActive, setAppActive] = useState(
    () => AppState.currentState === 'active',
  );

  useEffect(() => {
    const onChange = (estado: AppStateStatus) =>
      setAppActive(estado === 'active');
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  return focused && appActive;
}
