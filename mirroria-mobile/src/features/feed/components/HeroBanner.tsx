import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowRight, Glasses } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export function HeroBanner() {
  const router = useRouter();

  return (
    <View className="rounded-3xl bg-primary p-6 shadow-md overflow-hidden relative">
      {/* Círculo decorativo de fondo */}
      <View className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10" />
      <View className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-white/5" />

      {/* Pill de Temporada */}
      <View className="flex-row items-center gap-1.5 self-start px-3 py-1 rounded-full bg-white/20 mb-3.5">
        <Icon as={Sparkles} size={12} className="text-white" />
        <Text className="text-[11px] font-semibold text-white uppercase tracking-wider">
          Temporada 2026
        </Text>
      </View>

      {/* Título & Copy */}
      <Text className="text-2xl font-extrabold text-white tracking-tight leading-tight">
        Moda exclusiva con probador 3D
      </Text>
      <Text className="text-xs text-white/80 mt-2 leading-relaxed max-w-[280px]">
        Mirá cómo te queda cada prenda en tu celular antes de pedirla o retirarla en tienda.
      </Text>

      {/* Botones de acción */}
      <View className="flex-row items-center gap-2.5 mt-5">
        <Button
          size="sm"
          onPress={() => router.push('/(tabs)/catalogo')}
          className="bg-white rounded-xl flex-row items-center gap-1.5 px-4"
        >
          <Text className="text-xs font-bold text-primary">Ver catálogo</Text>
          <Icon as={ArrowRight} size={14} className="text-primary" />
        </Button>

        <Pressable
          onPress={() => router.push('/(tabs)/probador')}
          className="px-3.5 py-2 rounded-xl bg-white/15 border border-white/25 flex-row items-center gap-1.5"
        >
          <Icon as={Glasses} size={14} className="text-white" />
          <Text className="text-xs font-medium text-white">Vestidor 3D</Text>
        </Pressable>
      </View>
    </View>
  );
}
