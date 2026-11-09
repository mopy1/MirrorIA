import { EN_EXPO_GO } from './expoGo';

// Decart en React Native corre sobre LiveKit/WebRTC nativo: el SDK exige estos
// globals (RTCPeerConnection, MediaStream, URL, streams...) antes de conectar.
// Se registran una sola vez, al arrancar la app (ver app/_layout.tsx).
// En Expo Go ese módulo nativo no existe: se salta y el probador muestra un aviso.
if (!EN_EXPO_GO) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@livekit/react-native').registerGlobals();
}
