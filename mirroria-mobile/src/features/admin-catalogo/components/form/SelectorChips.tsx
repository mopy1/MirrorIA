import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export interface Opcion {
  value: string;
  label: string;
  detalle?: string;
}

interface Props {
  opciones: Opcion[];
  valor: string;
  onCambiar: (value: string) => void;
  /** Texto si no hay opciones cargadas. */
  vacio?: string;
  invalido?: boolean;
  /** En una sola fila con desplazamiento lateral (muchas sucursales). */
  enFila?: boolean;
}

/** Elegir una opción entre pocas (categoría, talla, color, sucursal): chips grandes para el pulgar. */
export function SelectorChips({ opciones, valor, onCambiar, vacio = 'No hay opciones cargadas', invalido, enFila }: Props) {
  if (opciones.length === 0) return <Text className="text-xs text-muted-foreground">{vacio}</Text>;
  const chips = opciones.map((o) => {
        const activo = o.value === valor;
        return (
          <Pressable
            key={o.value}
            onPress={() => onCambiar(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: activo }}
            className={cn(
              'min-h-10 justify-center rounded-xl border px-3.5 py-2',
              activo ? 'border-primary bg-primary' : 'border-border bg-background active:bg-muted'
            )}
          >
            <Text className={cn('text-sm font-medium', activo ? 'text-primary-foreground' : 'text-foreground')}>
              {o.label}
            </Text>
            {o.detalle ? (
              <Text className={cn('text-[11px]', activo ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                {o.detalle}
              </Text>
            ) : null}
          </Pressable>
        );
  });
  if (enFila) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {chips}
      </ScrollView>
    );
  }
  return <View className={cn('flex-row flex-wrap gap-2', invalido && 'rounded-lg border border-destructive p-1.5')}>{chips}</View>;
}
