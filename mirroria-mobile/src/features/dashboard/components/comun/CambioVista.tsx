import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { ModoDashboard } from '../../lib/vista-rol';

const NOMBRES: Record<ModoDashboard, string> = { resumen: 'Resumen del negocio', tienda: 'Hoy en la tienda' };

/** Pestañas "Resumen del negocio / Hoy en la tienda" (solo quien puede ver las dos). */
export function CambioVista({ modos, actual, onCambiar }: { modos: ModoDashboard[]; actual: ModoDashboard; onCambiar: (m: ModoDashboard) => void }) {
  if (modos.length < 2) return null;
  return (
    <View className="flex-row rounded-xl bg-muted p-1">
      {modos.map((m) => (
        <Pressable
          key={m}
          onPress={() => onCambiar(m)}
          accessibilityRole="tab"
          accessibilityState={{ selected: m === actual }}
          className={cn('h-10 flex-1 items-center justify-center rounded-lg', m === actual && 'bg-background shadow-sm')}>
          <Text className={cn('text-sm font-medium', m === actual ? 'text-foreground' : 'text-muted-foreground')}>{NOMBRES[m]}</Text>
        </Pressable>
      ))}
    </View>
  );
}
