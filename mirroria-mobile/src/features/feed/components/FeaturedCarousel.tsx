import React from 'react';
import { View, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Glasses, Shirt } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/src/lib/money';
import type { ProductoResponseDto } from '@/src/features/catalog/types/catalog.types';
import { getPrimaryImageUrl } from '@/src/lib/images';

interface FeaturedCarouselProps {
  products: ProductoResponseDto[];
}

export function FeaturedCarousel({ products }: FeaturedCarouselProps) {
  const router = useRouter();

  if (products.length === 0) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Colección con probador 3D
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)/catalogo')}
          className="flex-row items-center gap-0.5"
        >
          <Text className="text-xs font-medium text-primary">Ver todo</Text>
          <Icon as={ChevronRight} size={14} className="text-primary" />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {products.slice(0, 6).map((item) => {
          const img =
            getPrimaryImageUrl(item.imagenes) ??
            item.imagenes?.[0]?.url;

          return (
            <Pressable
              key={item.id}
              onPress={() => router.push('/(tabs)/probador')}
              className="w-40 rounded-2xl bg-card border border-border/70 overflow-hidden active:opacity-90 shadow-sm"
            >
              <View
                style={{ aspectRatio: 4 / 5 }}
                className="relative w-full bg-muted/40 items-center justify-center"
              >
                {img ? (
                  <Image
                    source={{ uri: img }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Icon as={Shirt} size={28} className="text-muted-foreground/40" />
                )}

                <View className="absolute top-2 left-2">
                  <Badge variant="default" className="px-1.5 py-0.5">
                    <Icon as={Glasses} size={10} className="text-primary-foreground mr-1" />
                    <Text className="text-[9px] font-bold text-primary-foreground">
                      3D
                    </Text>
                  </Badge>
                </View>
              </View>

              <View className="p-2.5 gap-1">
                <Text
                  numberOfLines={1}
                  className="text-xs font-semibold text-foreground"
                >
                  {item.titulo}
                </Text>
                <Text className="text-xs font-bold text-primary">
                  {formatMoney(item.precioCents)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
