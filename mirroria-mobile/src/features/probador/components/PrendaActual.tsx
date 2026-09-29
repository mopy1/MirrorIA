import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { formatMoney } from '@/src/lib/money';
import type { ProductoResponseDto } from '@/src/features/catalog/types/catalog.types';

/** Nombre y precio de lo que se está probando, con salida a la ficha real
 * (tallas, stock, carrito y reserva en tienda viven ahí). */
export function PrendaActual({ prenda }: { prenda: ProductoResponseDto | null }) {
  const router = useRouter();

  if (!prenda) {
    return (
      <Text className="text-xs text-center text-muted-foreground">
        Tocá una prenda de abajo para ponértela.
      </Text>
    );
  }

  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-foreground">
          {prenda.titulo}
        </Text>
        <Text className="text-xs font-semibold text-primary mt-0.5">
          {formatMoney(prenda.precioCents)}
        </Text>
      </View>
      <Button onPress={() => router.push(`/producto/${prenda.id}`)}>
        <Icon as={ShoppingBag} size={16} className="text-primary-foreground" />
        <Text className="text-xs font-bold text-primary-foreground">Ver prenda</Text>
      </Button>
    </View>
  );
}
