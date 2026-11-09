import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** Indicador 1-2-3 del asistente de alta. */
export function Pasos({ pasos, actual }: { pasos: readonly string[]; actual: number }) {
  return (
    <View className="flex-row items-center gap-2">
      {pasos.map((p, i) => (
        <View key={p} className="flex-1 gap-1.5">
          <View className={cn('h-1.5 rounded-full', i <= actual ? 'bg-primary' : 'bg-muted')} />
          <Text className={cn('text-[11px]', i === actual ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
            {i + 1}. {p}
          </Text>
        </View>
      ))}
    </View>
  );
}
