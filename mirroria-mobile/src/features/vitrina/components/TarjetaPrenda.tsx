import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Text } from '@/components/ui/text';
import type { PrendaVitrina } from '@/lib/db/tipos-espejo';

/** Prenda en la grilla: foto protagonista, nombre y precio discretos, puntos de color. */
export function TarjetaPrenda({ prenda, proporcion }: { prenda: PrendaVitrina; proporcion: number }) {
  const agotada = prenda.libre <= 0;
  return (
    <Pressable
      onPress={() => router.push(`/vitrina/${prenda.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${prenda.nombre}${agotada ? ', agotada' : ''}`}
      className="mb-5 active:opacity-80"
    >
      <View className="overflow-hidden rounded-lg bg-muted" style={{ aspectRatio: proporcion }}>
        {prenda.imagen ? (
          <Image source={prenda.imagen} style={{ flex: 1, opacity: agotada ? 0.55 : 1 }} contentFit="cover" transition={200} recyclingKey={prenda.id} />
        ) : null}
        {agotada || prenda.libre <= 2 ? (
          <View className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5">
            <Text className="font-body-semibold text-[11px]">{agotada ? 'Agotada' : `Últimas ${prenda.libre}`}</Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-2 font-body-medium text-sm" numberOfLines={1}>
        {prenda.nombre}
      </Text>
      <View className="mt-0.5 flex-row items-center justify-between">
        <MonedaBs cents={prenda.precioCents} className="text-xs text-muted-foreground" />
        <View className="flex-row gap-1">
          {prenda.colores.slice(0, 4).map((c) => (
            <View key={c} className="h-2.5 w-2.5 rounded-full border border-border" style={{ backgroundColor: c }} />
          ))}
        </View>
      </View>
    </Pressable>
  );
}
