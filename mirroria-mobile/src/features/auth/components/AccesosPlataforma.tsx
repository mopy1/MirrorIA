import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { useMarcaTienda } from '@/src/features/saas/hooks/useMarcaTienda';

/** Bajo el login: en qué tienda se está entrando, cambiarla o crear una tienda nueva. */
export function AccesosPlataforma() {
  const router = useRouter();
  const { marca, slug } = useMarcaTienda();
  return (
    <View className="mt-5 items-center gap-2.5">
      <Text className="text-xs text-muted-foreground text-center">
        Estás entrando a <Text className="text-xs font-semibold text-foreground">{marca?.nombre ?? slug}</Text>. Cada tienda tiene sus propias cuentas.
      </Text>
      <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-2">
        <Pressable onPress={() => router.push('/saas/tiendas')} hitSlop={6}>
          <Text className="text-sm font-medium text-primary">Cambiar de tienda</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/saas/registro')} hitSlop={6}>
          <Text className="text-sm font-medium text-primary">Crear mi tienda</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/saas/planes')} hitSlop={6}>
          <Text className="text-sm font-medium text-primary">Ver planes</Text>
        </Pressable>
      </View>
    </View>
  );
}
