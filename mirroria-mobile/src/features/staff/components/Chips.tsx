import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export interface OpcionChip {
  valor: string;
  label: string;
}

/** Filtro de una sola opción, en fila deslizable (cómodo para el pulgar). */
export function Chips({ opciones, valor, onCambiar }: { opciones: OpcionChip[]; valor: string; onCambiar: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-2">
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onCambiar(o.valor)}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            className={cn('h-9 justify-center rounded-full border px-4', activo ? 'border-primary bg-primary' : 'border-border bg-card')}
          >
            <Text className={cn('text-sm', activo ? 'text-primary-foreground font-semibold' : 'text-foreground')}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
