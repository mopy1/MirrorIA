import React from 'react';
import { Pressable, View } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatMoney } from '@/src/lib/money';
import type { LineaVenta } from '../lib/venta-caja';

function Boton({ icono, label, onPress, disabled }: { icono: typeof Plus; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card active:bg-muted disabled:opacity-40"
    >
      <Icon as={icono} size={18} className="text-foreground" />
    </Pressable>
  );
}

export function LineaCaja({
  linea,
  maximo,
  onSumar,
  onRestar,
  onQuitar,
}: {
  linea: LineaVenta;
  maximo: number;
  onSumar: () => void;
  onRestar: () => void;
  onQuitar: () => void;
}) {
  const { item, cantidad } = linea;
  return (
    <View className="gap-2 border-b border-border pb-3">
      <View className="flex-row items-start gap-2">
        <View className="flex-1">
          <Text className="text-base font-medium" numberOfLines={2}>{item.titulo}</Text>
          <Text className="text-sm text-muted-foreground">{item.talla} · {item.color} · {formatMoney(item.precioCents)} c/u</Text>
        </View>
        <Text className="text-base font-semibold">{formatMoney(item.precioCents * cantidad)}</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Boton icono={Minus} label={`Quitar una ${item.titulo}`} onPress={onRestar} />
        <Text className="w-8 text-center text-lg font-semibold">{cantidad}</Text>
        <Boton icono={Plus} label={`Sumar una ${item.titulo}`} onPress={onSumar} disabled={cantidad >= maximo} />
        <View className="flex-1" />
        <Pressable onPress={onQuitar} accessibilityRole="button" accessibilityLabel={`Sacar ${item.titulo} de la venta`} className="h-10 flex-row items-center gap-1.5 px-2">
          <Icon as={Trash2} size={18} className="text-destructive" />
          <Text className="text-sm text-destructive">Sacar</Text>
        </Pressable>
      </View>
    </View>
  );
}
