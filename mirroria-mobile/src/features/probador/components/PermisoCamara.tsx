import React from 'react';
import { Linking, View } from 'react-native';
import { Camera as CameraIcon } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

/**
 * Reemplaza la escena cuando no se pudo abrir la cámara (permiso negado o
 * cámara ocupada). Se ofrece reintentar y, si Android ya no vuelve a mostrar
 * el diálogo, ir a Ajustes.
 */
export function PermisoCamara({ onReintentar }: { onReintentar: () => void }) {
  return (
    <View
      style={{ aspectRatio: 3 / 4 }}
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
          El video se envía en vivo a la IA para vestirte con la prenda. No se
          guarda ninguna grabación.
        </Text>
      </View>

      <View className="flex-row gap-2">
        <Button onPress={onReintentar}>
          <Text className="text-primary-foreground font-bold">Reintentar</Text>
        </Button>
        <Button variant="outline" onPress={() => Linking.openSettings()}>
          <Text className="font-bold">Abrir Ajustes</Text>
        </Button>
      </View>
    </View>
  );
}
