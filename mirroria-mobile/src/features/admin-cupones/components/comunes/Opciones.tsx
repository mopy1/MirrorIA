import React from 'react';
import { Pressable, View } from 'react-native';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export interface Opcion {
  valor: string;
  etiqueta: string;
  detalle?: string;
}

interface Props {
  label?: string;
  opciones: Opcion[];
  valor: string;
  onCambiar: (valor: string) => void;
  error?: string;
  /** En fila (pocas opciones cortas) o en columna (con detalle). */
  enFila?: boolean;
}

/** Selector táctil: reemplaza al <Select> de la web por opciones grandes para el pulgar. */
export function Opciones({ label, opciones, valor, onCambiar, error, enFila }: Props) {
  return (
    <View className="gap-1.5">
      {label ? <Label>{label}</Label> : null}
      <View className={cn('gap-2', enFila && 'flex-row flex-wrap')}>
        {opciones.map((o) => {
          const activa = o.valor === valor;
          return (
            <Pressable
              key={o.valor}
              onPress={() => onCambiar(o.valor)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activa }}
              className={cn(
                'rounded-xl border px-3.5 py-3',
                enFila && 'flex-1 min-w-[40%] items-center',
                activa ? 'border-primary bg-primary/10' : 'border-border bg-card',
                error && !activa && 'border-destructive/50'
              )}
            >
              <Text className={cn('text-sm font-medium', activa ? 'text-primary' : 'text-foreground')}>
                {o.etiqueta}
              </Text>
              {o.detalle ? <Text className="text-xs text-muted-foreground mt-0.5">{o.detalle}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
