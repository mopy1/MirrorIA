import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Seccion } from '@/components/admin/Seccion';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { usoDelPlan } from '../../lib/graficos';
import type { PlanSaaSEjecutivoDto } from '../../types/dashboard.types';

/** Uso del plan, en lenguaje simple ("9 prendas · sin límite"). */
export function UsoPlan({ plan }: { plan: PlanSaaSEjecutivoDto }) {
  const router = useRouter();
  return (
    <Seccion
      titulo={`Tu plan: ${plan.planNombre}`}
      accion={
        <Pressable onPress={() => router.push('/admin/suscripcion')} hitSlop={8}>
          <Text className="text-sm font-semibold text-primary">Ver plan</Text>
        </Pressable>
      }>
      <Text className="text-xs text-muted-foreground">
        {plan.diasRestantes > 0
          ? `Quedan ${plan.diasRestantes} días del período actual`
          : 'El período actual terminó'}
      </Text>
      {usoDelPlan(plan).map((u) => (
        <View key={u.clave} className="gap-1.5">
          <Text className="text-sm">
            {u.texto}
            {u.cerca ? <Text className="text-sm text-amber-700"> · cerca del límite</Text> : null}
          </Text>
          {u.porcentaje !== null ? (
            <View className="h-1.5 overflow-hidden rounded-full bg-muted">
              <View
                className={cn('h-1.5 rounded-full', u.cerca ? 'bg-amber-500' : 'bg-primary/70')}
                style={{ width: `${Math.max(u.porcentaje, 2)}%` }}
              />
            </View>
          ) : null}
        </View>
      ))}
    </Seccion>
  );
}
