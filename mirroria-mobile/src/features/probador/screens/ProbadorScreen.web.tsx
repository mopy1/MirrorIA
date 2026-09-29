import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

/** El probador móvil usa WebRTC nativo; en la vista web de Expo se deriva al
 * probador de `mirroria-frontend`, que ya hace lo mismo en el navegador. */
export function ProbadorScreen() {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-background">
      <Text className="text-sm text-center text-muted-foreground">
        El Probador IA está disponible en la app del celular y en la tienda web.
      </Text>
    </View>
  );
}
