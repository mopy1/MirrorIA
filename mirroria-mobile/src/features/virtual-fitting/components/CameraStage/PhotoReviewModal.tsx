import React from 'react';
import { Image, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

interface PhotoReviewModalProps {
  /** URI devuelta por `react-native-view-shot` — normalmente ya trae
   * `file://`, pero se normaliza igual por si en algún dispositivo llega
   * como ruta cruda. */
  photoPath: string | null;
  onClose: () => void;
}

function toDisplayUri(pathOrUri: string): string {
  return /^[a-z]+:\/\//i.test(pathOrUri) ? pathOrUri : `file://${pathOrUri}`;
}

/**
 * Revisión de la foto recién capturada — pensada para pruebas de encuadre
 * en autorretrato, no para guardar en la galería (queda en el archivo
 * temporal que ya generó VisionCamera).
 */
export function PhotoReviewModal({ photoPath, onClose }: PhotoReviewModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={photoPath !== null} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black">
        {photoPath && (
          <Image
            source={{ uri: toDisplayUri(photoPath) }}
            resizeMode="contain"
            style={{ flex: 1 }}
          />
        )}

        <Pressable
          onPress={onClose}
          style={{ top: insets.top + 12 }}
          className="absolute right-3 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
        >
          <Icon as={X} size={18} className="text-white" />
        </Pressable>

        <View
          style={{ bottom: insets.bottom + 16 }}
          className="absolute left-0 right-0 items-center"
        >
          <Text className="text-xs text-white/70">
            Foto de prueba — no se guarda en tu galería
          </Text>
        </View>
      </View>
    </Modal>
  );
}
