import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export interface Pestana<T extends string> {
  id: T;
  label: string;
}

/** Control segmentado (Stock / Movimientos / Órdenes; Todas / Alertas). */
export function Pestanas<T extends string>({ items, valor, onCambiar }: { items: Pestana<T>[]; valor: T; onCambiar: (id: T) => void }) {
  return (
    <View className="flex-row rounded-xl bg-muted p-1">
      {items.map((i) => {
        const activo = i.id === valor;
        return (
          <Pressable
            key={i.id}
            onPress={() => onCambiar(i.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            className={cn('h-10 flex-1 items-center justify-center rounded-lg', activo && 'bg-background shadow-sm')}
          >
            <Text className={cn('text-sm', activo ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{i.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
