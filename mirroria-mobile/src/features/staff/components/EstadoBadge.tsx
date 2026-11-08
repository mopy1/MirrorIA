import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { Tono } from '../lib/etiquetas';

const CLASES: Record<Tono, { caja: string; texto: string }> = {
  ambar: { caja: 'border-amber-500/30 bg-amber-500/10', texto: 'text-amber-700' },
  verde: { caja: 'border-emerald-500/30 bg-emerald-500/10', texto: 'text-emerald-700' },
  azul: { caja: 'border-blue-500/30 bg-blue-500/10', texto: 'text-blue-700' },
  rojo: { caja: 'border-destructive/30 bg-destructive/10', texto: 'text-destructive' },
  gris: { caja: 'border-border bg-muted', texto: 'text-muted-foreground' },
};

export function EstadoBadge({ label, tono }: { label: string; tono: Tono }) {
  const c = CLASES[tono];
  return (
    <View className={cn('self-start rounded-full border px-2.5 py-0.5', c.caja)}>
      <Text className={cn('text-xs font-semibold', c.texto)}>{label}</Text>
    </View>
  );
}
