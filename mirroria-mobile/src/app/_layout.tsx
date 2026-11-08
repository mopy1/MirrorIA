import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { AppState, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SesionProvider, useSesion } from '@/contexts/SesionContext';
import { TemaProvider, useTema } from '@/contexts/TemaContext';
import { TiendaProvider, useTienda } from '@/contexts/TiendaContext';
import { useSincronizacionEspejo } from '@/features/espejo/hooks/use-sincronizacion-espejo';
import { obtenerDb } from '@/lib/db/sqlite-local';
import { ModalConflictoStock } from '@/features/sync/components/ModalConflictoStock';
import { OutboxManager } from '@/lib/outbox/outbox-manager';
import { useMotorOutbox } from '@/lib/outbox/use-motor-outbox';
import { NetInfoListener } from '@/lib/red/net-info-listener';
import { FUENTES_APP } from '@/lib/tema/fuentes';

void SplashScreen.preventAutoHideAsync();
// nativewind#1881: aviso inofensivo de css-interop con RN 0.88.
LogBox.ignoreLogs(['ImageBackground is deprecated']);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'));

/** Base lista antes de pintar: SQLite migrado + NetInfoListener + OutboxManager (ENVIANDO → PENDIENTE). */
const base = obtenerDb()
  .then(() => NetInfoListener.iniciar())
  .then(() => OutboxManager.iniciar());

/**
 * Frontera ICONIX `PantallaMovilApp`: layout raíz con los providers
 * (Query, Tienda, Sesión, Tema, SQLite, NetInfo, Outbox), el navegador y el modal global de conflicto.
 */
export default function PantallaMovilApp() {
  const [fuentes] = useFonts(FUENTES_APP);
  const [baseLista, setBaseLista] = React.useState(false);
  React.useEffect(() => {
    void base.finally(() => setBaseLista(true));
  }, []);
  if (!fuentes || !baseLista) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <TiendaProvider>
            <SesionProvider>
              <TemaProvider>
                <Navegacion />
                <PortalHost />
              </TemaProvider>
            </SesionProvider>
          </TiendaProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navegacion() {
  const tienda = useTienda();
  const sesion = useSesion();
  const { tema, colores } = useTema();
  // Solo el PRIMER arranque espera a tienda y sesión: después nunca se desmonta el navegador
  // (si no, al cambiar de tienda se pierde el estado de navegación).
  const listaAhora = tienda.cargada && sesion.cargada;
  const [lista, setLista] = React.useState(listaAhora);
  if (listaAhora && !lista) setLista(true);
  useSincronizacionEspejo();
  useMotorOutbox();

  React.useEffect(() => {
    if (lista) void SplashScreen.hideAsync();
  }, [lista]);
  if (!lista) return null;

  // La StatusBar raíz monta primero; una pantalla puede apilar la suya encima (la vitrina sobre su foto).
  return (
    <>
      <StatusBar style={tema.oscuro ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.background }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="tiendas" />
        <Stack.Screen name="acceso" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <ModalConflictoStock />
    </>
  );
}
