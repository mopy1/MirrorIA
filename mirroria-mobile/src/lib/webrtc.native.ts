import { registerGlobals } from '@livekit/react-native';

// Decart en React Native corre sobre LiveKit/WebRTC nativo: el SDK exige estos
// globals (RTCPeerConnection, MediaStream, URL, streams...) antes de conectar.
// Se registran una sola vez, al arrancar la app (ver app/_layout.tsx).
registerGlobals();
