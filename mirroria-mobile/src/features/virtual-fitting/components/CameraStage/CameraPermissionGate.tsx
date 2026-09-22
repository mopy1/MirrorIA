import React from 'react';
import { Linking, View } from 'react-native';
import { Camera as CameraIcon } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

interface CameraPermissionGateProps {
  canRequestPermission: boolean;
  onRequestPermission: () => void;
}

/**
 * Reemplaza el visor de cámara mientras no hay permiso otorgado. Si el
 * sistema ya no permite volver a pedirlo (`canRequestPermission: false`),
 * la única salida real es Ajustes del sistema — VisionCamera no puede
 * reabrir el diálogo de permiso en ese caso.
 */
export function CameraPermissionGate({
  canRequestPermission,
  onRequestPermission,
}: CameraPermissionGateProps) {
  return (
    <View
      style={{ minHeight: 420 }}
      className="items-center justify-center gap-4 rounded-3xl bg-card border border-border/80 p-6"
    >
      <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
        <Icon as={CameraIcon} size={28} className="text-primary" />
      </View>

      <View className="items-center gap-1 px-4">
        <Text className="text-sm font-bold text-center text-foreground">
          Necesitamos tu cámara
        </Text>
        <Text className="text-xs text-center text-muted-foreground leading-relaxed">
          El Vestidor 3D usa la cámara para detectar tu cuerpo y mostrarte la
          prenda en vivo. No se guarda ni se envía ningún video.
        </Text>
      </View>

      {canRequestPermission ? (
        <Button size="lg" onPress={onRequestPermission}>
          <Text className="text-primary-foreground font-bold">
            Permitir cámara
          </Text>
        </Button>
      ) : (
        <Button size="lg" variant="outline" onPress={() => Linking.openSettings()}>
          <Text className="font-bold">Abrir Ajustes</Text>
        </Button>
      )}
    </View>
  );
}
