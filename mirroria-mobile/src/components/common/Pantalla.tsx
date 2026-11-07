import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';
import { BarraRed } from './BarraRed';

/** Contenedor de toda pantalla: área segura + `BarraRed` arriba (empuja, no tapa). */
export function Pantalla({
  children,
  className,
  bordes = ['top'],
  conBarraRed = true,
}: {
  children: React.ReactNode;
  className?: string;
  bordes?: Edge[];
  conBarraRed?: boolean;
}) {
  return (
    <SafeAreaView edges={bordes} className="flex-1 bg-background">
      {conBarraRed ? <BarraRed /> : null}
      <View className={cn('flex-1', className)}>{children}</View>
    </SafeAreaView>
  );
}
