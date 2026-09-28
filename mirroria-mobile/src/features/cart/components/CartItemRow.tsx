import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { formatMoney } from '@/src/lib/money';
import { getPrimaryImageUrl } from '@/src/lib/images';
import type { ProductoResponseDto } from '@/src/features/catalog/types/catalog.types';

interface CartItemRowProps {
  producto: ProductoResponseDto;
  tallaNombre: string;
  colorNombre: string;
  cantidad: number;
  onRemove: () => void;
}

export function CartItemRow({
  producto,
  tallaNombre,
  colorNombre,
  cantidad,
  onRemove,
}: CartItemRowProps) {
  const image = getPrimaryImageUrl(producto.imagenes) ?? producto.imagenes?.[0]?.url;

  return (
    <View className="flex-row gap-3 p-3 rounded-2xl bg-card border border-border/70">
      <View className="w-16 h-20 rounded-xl bg-muted/30 overflow-hidden">
        {image && <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />}
      </View>

      <View className="flex-1 gap-1 justify-center">
        <Text numberOfLines={1} className="text-xs font-semibold text-foreground">
          {producto.titulo}
        </Text>
        <Text className="text-[11px] text-muted-foreground">
          {tallaNombre} · {colorNombre} · x{cantidad}
        </Text>
        <Text className="text-xs font-bold text-primary">
          {formatMoney(producto.precioCents * cantidad)}
        </Text>
      </View>

      <Pressable
        onPress={onRemove}
        hitSlop={8}
        className="w-7 h-7 items-center justify-center rounded-full active:bg-muted"
      >
        <Icon as={X} size={16} className="text-muted-foreground" />
      </Pressable>
    </View>
  );
}
