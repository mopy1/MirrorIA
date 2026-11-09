import { Image } from 'expo-image';
import { FlatList, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { urlImagen } from '@/lib/config';
import type { PrendaProbable } from '@/lib/probador/prendas';
import { cn } from '@/lib/utils';

interface Props {
  prendas: PrendaProbable[];
  elegidaId: string | null;
  onElegir: (p: PrendaProbable) => void;
}

/** Tira horizontal de la vitrina (SQLite): tocar una prenda se la pone en vivo. */
export function TiraPrendas({ prendas, elegidaId, onElegir }: Props) {
  return (
    <FlatList
      horizontal
      data={prendas}
      keyExtractor={(p) => p.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}
      renderItem={({ item }) => {
        const elegida = item.id === elegidaId;
        return (
          <Pressable onPress={() => onElegir(item)} accessibilityRole="button" accessibilityState={{ selected: elegida }} accessibilityLabel={`Probarme ${item.nombre}`} className="w-[68px] items-center">
            <View className={cn('h-[68px] w-[68px] overflow-hidden rounded-xl border-2', elegida ? 'border-primary' : 'border-white/20')}>
              <Image source={urlImagen(item.imagen)} style={{ flex: 1 }} contentFit="cover" transition={150} />
            </View>
            <Text numberOfLines={1} className={cn('mt-1 text-[11px]', elegida ? 'font-body-semibold text-white' : 'text-white/70')}>
              {item.nombre}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}
