import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Store, ChevronRight, QrCode } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

export function StorePassTeaser() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/perfil')}
      className="rounded-2xl p-4 bg-card border border-border/80 flex-row items-center justify-between active:opacity-90 shadow-sm"
    >
      <View className="flex-row items-center gap-3.5 flex-1">
        <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
          <Icon as={QrCode} size={24} className="text-primary" />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-bold text-foreground">
              Pase de Tienda
            </Text>
            <View className="px-1.5 py-0.5 rounded bg-primary/10">
              <Text className="text-[10px] font-semibold text-primary">
                Cero Filas
              </Text>
            </View>
          </View>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Apartá tus prendas desde el celular y probalas en sucursal con cita
          </Text>
        </View>
      </View>

      <Icon as={ChevronRight} size={18} className="text-muted-foreground ml-2" />
    </Pressable>
  );
}
