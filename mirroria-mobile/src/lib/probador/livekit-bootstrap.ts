// Efecto lateral que corre ANTES del router (README de @decartai/sdk, "React Native / Expo"):
// instala RTCPeerConnection, MediaStream, etc. de @livekit/react-native-webrtc como globales
// para que livekit-client (que usa Decart por dentro) funcione igual que en el navegador.
// Solo existe en el development build / APK: LiveKit no corre en Expo Go.
import { registerGlobals } from '@livekit/react-native';

registerGlobals();
