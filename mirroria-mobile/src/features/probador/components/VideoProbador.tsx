import { RTCView, type MediaStream } from '@livekit/react-native-webrtc';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/text';

interface Props {
  local: MediaStream | null;
  remoto: MediaStream | null;
  conectando: boolean;
}

/**
 * Video a pantalla completa: el stream de Decart cuando llega; mientras tanto, la cámara local.
 * Los dos espejados en la vista nativa (el `mirror` saliente de Decart no existe en React Native).
 */
export function VideoProbador({ local, remoto, conectando }: Props) {
  const stream = remoto ?? local;
  return (
    <View className="absolute inset-0 bg-black">
      {stream ? <RTCView streamURL={stream.toURL()} objectFit="cover" mirror zOrder={0} style={{ flex: 1 }} /> : null}
      {conectando ? (
        <View className="absolute inset-0 items-center justify-center bg-black/45">
          <ActivityIndicator color="#ffffff" size="large" />
          <Text className="mt-3 font-body-semibold text-sm text-white">Conectando con la IA…</Text>
          <Text className="mt-1 text-xs text-white/75">Quedate de frente y con buena luz</Text>
        </View>
      ) : null}
    </View>
  );
}
