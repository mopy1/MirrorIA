import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

/** Bloque con título dentro de una pantalla del panel. */
export function Seccion({
  titulo,
  accion,
  children,
}: {
  titulo: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="rounded-2xl border border-border bg-card p-4 gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold">{titulo}</Text>
        {accion}
      </View>
      {children}
    </View>
  );
}
