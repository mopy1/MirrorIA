import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export interface OpcionChip<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  opciones: OpcionChip<T>[];
  valor: T;
  onCambiar: (id: T) => void;
  etiqueta?: string;
}

/** Fila de opciones deslizable (períodos, horizontes, sucursales): reemplaza al <select> de la web. */
export function SelectorChips<T extends string>({ opciones, valor, onCambiar, etiqueta }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-2" accessibilityLabel={etiqueta}>
      {opciones.map((o) => {
        const activo = o.id === valor;
        return (
          <Pressable
            key={o.id}
            onPress={() => onCambiar(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            className={cn(
              'h-9 justify-center rounded-full border px-3.5',
              activo ? 'border-primary bg-primary' : 'border-border bg-card active:bg-muted'
            )}>
            <Text className={cn('text-sm font-medium', activo ? 'text-primary-foreground' : 'text-foreground')}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
