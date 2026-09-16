import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { Sparkles, Glasses, Shirt } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { formatMoney } from '@/src/lib/money';
import type { ProductoResponseDto } from '../types/catalog.types';

interface ProductCardMobileProps {
  product: ProductoResponseDto;
  onPress: (product: ProductoResponseDto) => void;
  onPressTryOn?: (product: ProductoResponseDto) => void;
}

export function ProductCardMobile({
  product,
  onPress,
  onPressTryOn,
}: ProductCardMobileProps) {
  const primaryImage =
    product.imagenes?.find((img) => img.esPrincipal)?.url ??
    product.imagenes?.[0]?.url;

  const has3D = Boolean(product.modeloArUrl);

  return (
    <Pressable
      onPress={() => onPress(product)}
      className="flex-1 m-1.5 rounded-2xl bg-card border border-border/70 overflow-hidden shadow-sm active:opacity-90"
    >
      {/* Contenedor de Imagen */}
      <View
        style={{ aspectRatio: 4 / 5 }}
        className="relative w-full bg-muted/30 items-center justify-center overflow-hidden"
      >
        {primaryImage ? (
          <Image
            source={{ uri: primaryImage }}
            className="w-full h-full object-cover"
            resizeMode="cover"
          />
        ) : (
          <View className="items-center justify-center p-4">
            <Icon as={Shirt} size={36} className="text-muted-foreground/40" />
            <Text className="text-[10px] text-muted-foreground mt-2 font-medium">
              MirrorIA
            </Text>
          </View>
        )}

        {/* Badge 3D flotante */}
        {has3D && (
          <View className="absolute top-2 left-2">
            <Badge
              variant="default"
              className="bg-primary/95 px-2 py-0.5 flex-row items-center gap-1 shadow-sm"
            >
              <Icon as={Glasses} size={11} className="text-primary-foreground" />
              <Text className="text-[10px] font-bold text-primary-foreground">
                3D Listo
              </Text>
            </Badge>
          </View>
        )}
      </View>

      {/* Contenido del Producto */}
      <View className="p-3 justify-between flex-1 gap-1.5">
        <Text
          numberOfLines={2}
          className="text-xs font-semibold text-foreground leading-tight"
        >
          {product.titulo}
        </Text>

        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-sm font-bold text-primary">
            {formatMoney(product.precioCents)}
          </Text>

          {has3D && (
            <Pressable
              onPress={() => onPressTryOn?.(product)}
              hitSlop={6}
              className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 flex-row items-center gap-1"
            >
              <Icon as={Sparkles} size={11} className="text-primary" />
              <Text className="text-[10px] font-semibold text-primary">
                Probar
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}
