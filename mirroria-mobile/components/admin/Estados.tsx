import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AlertCircle, Inbox } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <View className="items-center justify-center py-12 gap-3">
      <ActivityIndicator />
      <Text className="text-sm text-muted-foreground">{texto}</Text>
    </View>
  );
}

export function Vacio({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <View className="items-center justify-center py-12 gap-2 px-6">
      <Icon as={Inbox} size={32} className="text-muted-foreground" />
      <Text className="text-base font-semibold text-center">{titulo}</Text>
      {detalle ? <Text className="text-sm text-muted-foreground text-center">{detalle}</Text> : null}
    </View>
  );
}

export function ErrorVista({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <View className="items-center justify-center py-12 gap-3 px-6">
      <Icon as={AlertCircle} size={32} className="text-destructive" />
      <Text className="text-sm text-center">{mensaje}</Text>
      {onReintentar ? (
        <Button variant="outline" onPress={onReintentar}>
          <Text>Reintentar</Text>
        </Button>
      ) : null}
    </View>
  );
}
