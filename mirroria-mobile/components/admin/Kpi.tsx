import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface Props {
  titulo: string;
  valor: string;
  /** Variación en %, positiva o negativa; null si no hay con qué comparar. */
  delta?: number | null;
  detalle?: string;
  className?: string;
}

/** Tarjeta de una cifra clave (ventas de hoy, ticket promedio…). */
export function Kpi({ titulo, valor, delta, detalle, className }: Props) {
  const conDelta = typeof delta === 'number' && Number.isFinite(delta);
  const sube = conDelta && (delta as number) >= 0;
  return (
    <View className={cn('flex-1 min-w-[45%] rounded-2xl border border-border bg-card p-4 gap-1', className)}>
      <Text className="text-xs text-muted-foreground">{titulo}</Text>
      <Text className="text-xl font-bold">{valor}</Text>
      {conDelta ? (
        <Text className={cn('text-xs font-medium', sube ? 'text-emerald-600' : 'text-destructive')}>
          {sube ? '▲' : '▼'} {Math.abs(delta as number).toFixed(1)} %
        </Text>
      ) : null}
      {detalle ? <Text className="text-xs text-muted-foreground">{detalle}</Text> : null}
    </View>
  );
}
