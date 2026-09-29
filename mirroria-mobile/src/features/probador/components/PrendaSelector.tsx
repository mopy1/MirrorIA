import React from 'react';
import { View, ScrollView, Pressable, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import type { ProductoResponseDto } from '@/src/features/catalog/types/catalog.types';
import { getPrimaryImageUrl } from '@/src/lib/images';

interface PrendaSelectorProps {
  prendas: ProductoResponseDto[];
  seleccionada: ProductoResponseDto | null;
  onSelect: (prenda: ProductoResponseDto) => void;
}

export function PrendaSelector({ prendas, seleccionada, onSelect }: PrendaSelectorProps) {
  if (prendas.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
        Prendas para probar
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{ gap: 10 }}
      >
        {prendas.map((item) => {
          const activa = seleccionada?.id === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item)}
              className={`w-[88px] rounded-2xl p-2 border items-center ${
                activa ? 'bg-primary/10 border-primary' : 'bg-card border-border/70'
              }`}
            >
              <View className="w-16 h-16 rounded-xl bg-muted/50 overflow-hidden mb-1.5">
                <Image
                  source={{ uri: getPrimaryImageUrl(item.imagenes) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text
                numberOfLines={1}
                className={`text-[11px] text-center ${
                  activa ? 'text-primary font-bold' : 'text-foreground font-medium'
                }`}
              >
                {item.titulo}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
