import { AppState, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * En iOS la promesa del navegador vuelve al cerrarlo; en Android y en la web
 * vuelve apenas se abre, así que se espera a que la app vuelva al frente.
 */
export async function abrirYConfirmarAlVolver(url: string, alVolver: () => void | Promise<void>) {
  if (Platform.OS === 'ios') {
    await WebBrowser.openBrowserAsync(url);
    await alVolver();
    return;
  }
  let fuera = false;
  const sub = AppState.addEventListener('change', (estado) => {
    if (estado !== 'active') fuera = true;
    else if (fuera) {
      sub.remove();
      void alVolver();
    }
  });
  await WebBrowser.openBrowserAsync(url);
}
