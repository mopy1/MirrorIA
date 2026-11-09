import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { OpcionSelector } from '../types/reports.types';

interface Props {
  etiqueta?: string;
  ayuda?: string;
  opciones: OpcionSelector[];
  valor: string;
  onCambiar: (id: string) => void;
  deshabilitado?: boolean;
}

/** Selector de una opción para el pulgar: chips que se acomodan en varias líneas. */
export function Chips({ etiqueta, ayuda, opciones, valor, onCambiar, deshabilitado }: Props) {
  return (
    <View className="gap-1.5">
      {etiqueta ? <Text className="text-sm font-semibold">{etiqueta}</Text> : null}
      {ayuda ? <Text className="text-xs text-muted-foreground">{ayuda}</Text> : null}
      <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
        {opciones.map((o) => {
          const activo = o.id === valor;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: activo, disabled: deshabilitado }}
              disabled={deshabilitado}
              onPress={() => onCambiar(o.id)}
              className={cn(
                'min-h-9 justify-center rounded-full border px-3.5 py-1.5',
                activo ? 'border-primary bg-primary' : 'border-border bg-background',
                deshabilitado && 'opacity-50'
              )}
            >
              <Text className={cn('text-sm', activo ? 'font-semibold text-primary-foreground' : 'text-foreground')}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Interruptor sí/no con texto (no hay Switch en components/ui). */
export function Interruptor({ etiqueta, ayuda, valor, onCambiar, deshabilitado }: {
  etiqueta: string;
  ayuda?: string;
  valor: boolean;
  onCambiar: (v: boolean) => void;
  deshabilitado?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: valor, disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={() => onCambiar(!valor)}
      className={cn('flex-row items-center gap-3 py-1', deshabilitado && 'opacity-50')}
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold">{etiqueta}</Text>
        {ayuda ? <Text className="text-xs text-muted-foreground">{ayuda}</Text> : null}
      </View>
      <View className={cn('h-7 w-12 justify-center rounded-full px-0.5', valor ? 'bg-primary' : 'bg-muted')}>
        <View className={cn('h-6 w-6 rounded-full bg-background shadow-sm', valor && 'self-end')} />
      </View>
    </Pressable>
  );
}
