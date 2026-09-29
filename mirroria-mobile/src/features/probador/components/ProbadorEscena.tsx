import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { RTCView, type MediaStream } from '@livekit/react-native-webrtc';
import { RefreshCw, SwitchCamera } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import type { EstadoIA } from '../hooks/useProbadorIA';

interface ProbadorEscenaProps {
  local: MediaStream | null;
  remotoUrl: string | null;
  estado: EstadoIA;
  espejo: boolean;
  onCambiarCamara: () => void;
  onReconectar: () => void;
}

/**
 * Video vestido por la IA a pantalla completa, con la cámara propia en
 * miniatura. Mientras la IA no devuelve video se muestra la cámara sola con
 * el estado de la conexión encima.
 */
export function ProbadorEscena({
  local,
  remotoUrl,
  estado,
  espejo,
  onCambiarCamara,
  onReconectar,
}: ProbadorEscenaProps) {
  const localUrl = local?.toURL() ?? null;
  const principal = remotoUrl ?? localUrl;

  return (
    <View
      style={{ aspectRatio: 3 / 4 }}
      className="relative w-full overflow-hidden rounded-3xl bg-foreground/90"
    >
      {principal && (
        <RTCView
          streamURL={principal}
          // El video de Decart ya viene orientado (su marca "AI Generated" se
          // leería al revés): solo se espeja la cámara propia.
          mirror={remotoUrl ? false : espejo}
          objectFit="cover"
          zOrder={0}
          style={{ flex: 1 }}
        />
      )}

      {remotoUrl && localUrl && (
        <View className="absolute top-3 left-3 w-20 overflow-hidden rounded-xl border-2 border-white/80" style={{ aspectRatio: 3 / 4 }}>
          <RTCView streamURL={localUrl} mirror={espejo} objectFit="cover" zOrder={1} style={{ flex: 1 }} />
        </View>
      )}

      {!remotoUrl && estado !== 'error' && (
        <View className="absolute bottom-4 self-center flex-row items-center gap-2 rounded-full bg-black/60 px-4 py-2">
          <ActivityIndicator size="small" color="#fff" />
          <Text className="text-xs font-semibold text-white">Conectando con la IA…</Text>
        </View>
      )}

      {estado === 'error' && (
        <Pressable
          onPress={onReconectar}
          className="absolute bottom-4 self-center flex-row items-center gap-2 rounded-full bg-destructive px-4 py-2 active:opacity-80"
        >
          <Icon as={RefreshCw} size={14} className="text-white" />
          <Text className="text-xs font-semibold text-white">Se cortó la IA · Reconectar</Text>
        </Pressable>
      )}

      <Pressable
        onPress={onCambiarCamara}
        hitSlop={8}
        accessibilityLabel="Cambiar de cámara"
        className="absolute top-3 right-3 w-10 h-10 items-center justify-center rounded-full bg-black/50 active:opacity-80"
      >
        <Icon as={SwitchCamera} size={20} className="text-white" />
      </Pressable>
    </View>
  );
}
