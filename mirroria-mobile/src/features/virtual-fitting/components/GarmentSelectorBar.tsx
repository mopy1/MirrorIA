import React from 'react';
import { View, ScrollView, Pressable, Image } from 'react-native';
import { Shirt } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import type { ProductoResponseDto } from '@/src/features/catalog/types/catalog.types';

interface GarmentSelectorBarProps {
  products: ProductoResponseDto[];
  selectedProduct: ProductoResponseDto | null;
  onSelect: (product: ProductoResponseDto) => void;
}

export function GarmentSelectorBar({
  products,
  selectedProduct,
  onSelect,
}: GarmentSelectorBarProps) {
  if (products.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
        Prendas para probar
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 10 }}
      >
        {products.map((item) => {
          const isSelected = selectedProduct?.id === item.id;
          const img =
            item.imagenes?.find((i) => i.esPrincipal)?.url ??
            item.imagenes?.[0]?.url;

          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item)}
              className={`w-[88px] rounded-2xl p-2 border items-center justify-center ${
                isSelected
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border/70'
              }`}
            >
              <View className="w-16 h-16 rounded-xl bg-muted/50 items-center justify-center overflow-hidden mb-1.5">
                {img ? (
                  <Image
                    source={{ uri: img }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Icon as={Shirt} size={22} className="text-muted-foreground/50" />
                )}
              </View>

              <Text
                numberOfLines={1}
                className={`text-[11px] text-center font-medium ${
                  isSelected ? 'text-primary font-bold' : 'text-foreground'
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
