import { router, type Href } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Titulo } from './Titulo';

interface Props {
  titulo?: string;
  /** A dónde volver si no hay historial (p. ej. al abrir desde una notificación). */
  respaldo: Href;
  derecha?: React.ReactNode;
}

/** "← Volver" en toda pantalla que no es raíz de tab (cero pantallas huérfanas). */
export function EncabezadoPantalla({ titulo, respaldo, derecha }: Props) {
  const volver = () => (router.canGoBack() ? router.back() : router.replace(respaldo));
  return (
    <View className="min-h-14 flex-row items-center gap-1 px-2">
      <Pressable
        onPress={volver}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        className="h-11 flex-row items-center gap-1 rounded-full px-2 active:bg-accent"
      >
        <Icon as={CaretLeft} size={20} weight="bold" />
        <Text className="font-body-medium text-sm">Volver</Text>
      </Pressable>
      <View className="flex-1 items-center pr-16">
        {titulo ? (
          <Titulo nivel="h3" numberOfLines={1}>
            {titulo}
          </Titulo>
        ) : null}
      </View>
      {derecha ? <View className="absolute right-3">{derecha}</View> : null}
    </View>
  );
}
