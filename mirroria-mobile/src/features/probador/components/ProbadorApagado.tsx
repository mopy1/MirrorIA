import React from 'react';
import { View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

/**
 * Estado inicial de la escena: la sesión con Decart cobra por tiempo de uso,
 * así que no se conecta sola al abrir la pestaña — la clienta la enciende.
 */
export function ProbadorApagado({ onEncender }: { onEncender: () => void }) {
  return (
    <View
      style={{ aspectRatio: 3 / 4 }}
      className="items-center justify-center gap-4 rounded-3xl bg-card border border-border/80 p-6"
    >
      <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
        <Icon as={Sparkles} size={28} className="text-primary" />
      </View>
      <View className="items-center gap-1 px-4">
        <Text className="text-sm font-bold text-center text-foreground">Probador en pausa</Text>
        <Text className="text-xs text-center text-muted-foreground leading-relaxed">
          Encendelo para verte en vivo con la prenda elegida. Se apaga solo al salir
          de esta pestaña.
        </Text>
      </View>
      <Button size="lg" onPress={onEncender}>
        <Text className="text-primary-foreground font-bold">Encender probador</Text>
      </Button>
    </View>
  );
}
