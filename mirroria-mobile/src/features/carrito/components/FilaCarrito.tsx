import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { BadgeEstadoOutbox } from '@/components/common/BadgeEstadoOutbox';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Text } from '@/components/ui/text';
import type { ItemCarritoLocal } from '@/lib/db/repos/carrito.repo';

/** Fila de 96 px: foto, prenda, talla/color, badge si se agregó sin red y subtotal en mono. Tocar abre la ficha. */
export function FilaCarrito({ item }: { item: ItemCarritoLocal }) {
  return (
    <Pressable onPress={() => router.push(`/vitrina/${item.productoId}`)} className="flex-row gap-4 border-b border-border bg-background py-4 active:opacity-80">
      <View className="h-24 w-[72px] overflow-hidden rounded-md bg-muted">
        {item.imagen ? <Image source={item.imagen} style={{ flex: 1 }} contentFit="cover" /> : null}
      </View>
      <View className="flex-1 justify-between">
        <View>
          <Text className="font-body-medium text-sm" numberOfLines={2}>
            {item.nombre}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            Talla {item.talla} · {item.color}
          </Text>
          {item.pendientes > 0 ? <BadgeEstadoOutbox estado="PENDIENTE" className="mt-1.5" /> : null}
        </View>
        <View className="flex-row items-end justify-between">
          <Text className="font-mono text-xs text-muted-foreground">× {item.cantidad}</Text>
          <MonedaBs cents={item.precioCents * item.cantidad} />
        </View>
      </View>
    </Pressable>
  );
}
