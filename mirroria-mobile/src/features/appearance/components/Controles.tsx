import React from 'react';
import { Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { NivelMarca } from '../../saas/types/saas.types';
import { PLAN_DE_NIVEL } from '../lib/marca.constants';

/**
 * Bloque con candado: si el plan no lo incluye se ve igual (es lo que vende
 * el plan superior) pero apagado, con el plan que lo trae y "Mejorar plan".
 */
export function Candado({ bloqueado, nivel, titulo, children }: { bloqueado: boolean; nivel: NivelMarca; titulo: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <View className="gap-2.5">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="text-sm font-semibold text-foreground">{titulo}</Text>
        {bloqueado && (
          <>
            <View className="flex-row items-center gap-1 rounded-full border border-border px-2 py-0.5">
              <Icon as={Lock} size={11} className="text-muted-foreground" />
              <Text className="text-[11px] text-muted-foreground">Plan {PLAN_DE_NIVEL[nivel]}</Text>
            </View>
            <Pressable onPress={() => router.push('/admin/suscripcion')} hitSlop={6}>
              <Text className="text-xs font-medium text-primary">Mejorar plan</Text>
            </Pressable>
          </>
        )}
      </View>
      <View pointerEvents={bloqueado ? 'none' : 'auto'} aria-disabled={bloqueado} className={cn(bloqueado && 'opacity-50')}>
        {children}
      </View>
    </View>
  );
}

/** Fila con interruptor (modo oscuro, botón del probador, insignia). */
export function FilaSwitch({ titulo, detalle, valor, onCambiar }: { titulo: string; detalle: string; valor: boolean; onCambiar: (v: boolean) => void }) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-border p-3">
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground">{titulo}</Text>
        <Text className="text-xs text-muted-foreground">{detalle}</Text>
      </View>
      <Switch value={valor} onValueChange={onCambiar} accessibilityLabel={titulo} />
    </View>
  );
}

/** Opciones tipo píldora (bordes, fuente, destino del botón). */
export function Opciones<T extends string>({ opciones, valor, onCambiar }: { opciones: { valor: T; label: string }[]; valor: T; onCambiar: (v: T) => void }) {
  return (
    <View role="radiogroup" className="flex-row flex-wrap gap-2">
      {opciones.map((o) => (
        <Pressable
          key={o.valor}
          role="radio"
          aria-checked={valor === o.valor}
          onPress={() => onCambiar(o.valor)}
          className={cn('rounded-full border px-3.5 py-2', valor === o.valor ? 'border-primary bg-primary' : 'border-border')}
        >
          <Text className={cn('text-xs font-medium', valor === o.valor ? 'text-primary-foreground' : 'text-foreground')}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
