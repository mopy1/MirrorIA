import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export type TonoEtiqueta = 'bien' | 'atencion' | 'alerta' | 'mal' | 'critico' | 'neutro';

const CLASES: Record<TonoEtiqueta, { caja: string; texto: string }> = {
  bien: { caja: 'bg-emerald-500/10', texto: 'text-emerald-700 dark:text-emerald-400' },
  atencion: { caja: 'bg-amber-500/15', texto: 'text-amber-800 dark:text-amber-300' },
  alerta: { caja: 'bg-orange-500/15', texto: 'text-orange-800 dark:text-orange-300' },
  mal: { caja: 'bg-rose-500/10', texto: 'text-rose-700 dark:text-rose-400' },
  critico: { caja: 'bg-rose-500/10', texto: 'text-rose-700 dark:text-rose-400' },
  neutro: { caja: 'bg-muted', texto: 'text-muted-foreground' },
};

/** Estado en palabras con color de apoyo (nunca solo color). */
export function EtiquetaTono({ tono, children }: { tono: TonoEtiqueta; children: React.ReactNode }) {
  const c = CLASES[tono] ?? CLASES.neutro;
  return (
    <View className={cn('self-start rounded-full px-2.5 py-0.5', c.caja)}>
      <Text className={cn('text-xs font-semibold', c.texto)}>{children}</Text>
    </View>
  );
}
