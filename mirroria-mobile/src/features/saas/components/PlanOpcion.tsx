import React from 'react';
import { Pressable, View } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { precioPlanBs, resumenLimites } from '../lib/limites';
import type { PlanDto } from '../types/saas.types';

interface Props {
  plan: PlanDto;
  activo: boolean;
  onPress: () => void;
  etiqueta?: string;
}

/** Un plan como opción tipo radio: nombre, precio por mes y sus topes. */
export function PlanOpcion({ plan, activo, onPress, etiqueta }: Props) {
  return (
    <Pressable
      role="radio"
      aria-checked={activo}
      onPress={onPress}
      className={cn(
        'flex-row items-start gap-3 rounded-2xl border p-4',
        activo ? 'border-primary bg-primary/5' : 'border-border bg-card active:bg-muted/40',
      )}
    >
      <Icon as={activo ? CheckCircle2 : Circle} size={20} className={cn('mt-0.5', activo ? 'text-primary' : 'text-muted-foreground')} />
      <View className="flex-1 gap-1">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text className="text-base font-semibold text-foreground">
            {plan.nombre}
            {etiqueta ? <Text className="text-xs font-normal text-muted-foreground">{`  ${etiqueta}`}</Text> : null}
          </Text>
          <Text className="text-sm font-semibold text-foreground">
            {precioPlanBs(plan.precioMensualCents)}
            <Text className="text-xs font-normal text-muted-foreground">/mes</Text>
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">{resumenLimites(plan.limites)}</Text>
      </View>
    </Pressable>
  );
}
