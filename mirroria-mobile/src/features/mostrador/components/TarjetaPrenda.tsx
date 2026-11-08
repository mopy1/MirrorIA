import React from 'react';
import { Pressable, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/src/lib/money';
import type { ItemMostrador } from '../lib/venta-caja';

interface Props {
  item: ItemMostrador;
  disponible: number;
  enVenta: number;
  onAgregar: () => void;
}

/** Una prenda del catálogo de caja: tocarla la suma a la venta. */
export function TarjetaPrenda({ item, disponible, enVenta, onAgregar }: Props) {
  const libre = disponible - enVenta;
  const agotada = libre <= 0;
  return (
    <Pressable
      onPress={onAgregar}
      disabled={agotada}
      accessibilityRole="button"
      accessibilityLabel={`Agregar ${item.titulo} talla ${item.talla} ${item.color}`}
      className={cn('flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5 active:bg-muted', agotada && 'opacity-50')}
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-medium" numberOfLines={1}>{item.titulo}</Text>
        <Text className="text-sm text-muted-foreground">{item.talla} · {item.color}</Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Text className="text-base font-semibold">{formatMoney(item.precioCents)}</Text>
          <Text className={cn('text-xs', disponible === 0 ? 'text-destructive' : 'text-muted-foreground')}>
            {disponible === 0 ? 'Agotado' : `${disponible} disp.`}
          </Text>
          {enVenta > 0 ? <Text className="text-xs font-semibold text-primary">· {enVenta} en la venta</Text> : null}
        </View>
      </View>
      <View className={cn('h-11 w-11 items-center justify-center rounded-full', agotada ? 'bg-muted' : 'bg-primary')}>
        <Icon as={Plus} size={22} className={agotada ? 'text-muted-foreground' : 'text-primary-foreground'} />
      </View>
    </Pressable>
  );
}
