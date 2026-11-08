import React from 'react';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const TONOS = {
  info: { caja: 'border-sky-500/30 bg-sky-500/10', texto: 'text-sky-900', icono: 'text-sky-700' },
  ok: { caja: 'border-emerald-500/30 bg-emerald-500/10', texto: 'text-emerald-900', icono: 'text-emerald-700' },
  alerta: { caja: 'border-amber-500/40 bg-amber-500/10', texto: 'text-amber-900', icono: 'text-amber-700' },
  error: { caja: 'border-destructive/40 bg-destructive/10', texto: 'text-destructive', icono: 'text-destructive' },
};

/** Recuadro de aviso del panel (equivale al Alert de la web). */
export function Aviso({
  tono = 'info',
  icono,
  children,
  accion,
}: {
  tono?: keyof typeof TONOS;
  icono?: LucideIcon;
  children: React.ReactNode;
  accion?: React.ReactNode;
}) {
  const t = TONOS[tono];
  return (
    <View className={cn('rounded-xl border p-3 gap-2', t.caja)}>
      <View className="flex-row gap-2.5">
        {icono ? <Icon as={icono} size={18} className={cn('mt-0.5', t.icono)} /> : null}
        <View className="flex-1">
          {typeof children === 'string' ? <Text className={cn('text-sm leading-5', t.texto)}>{children}</Text> : children}
        </View>
      </View>
      {accion}
    </View>
  );
}
