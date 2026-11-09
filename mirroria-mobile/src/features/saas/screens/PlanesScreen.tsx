import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Cargando, ErrorVista } from '@/components/admin/Estados';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { saasApi } from '../api/saasApi';
import { useRecurso } from '../hooks/useRecurso';
import { esDestacado, FILAS_LIMITES, formatLimite, INCLUIDO_EN_TODOS, NIVELES, precioPlanBs, precioPlanUsd } from '../lib/limites';
import type { PlanDto } from '../types/saas.types';

type Moneda = 'BOB' | 'USD';

/** `GET /saas/planes`: los planes de la plataforma para abrir una tienda (como `/planes` de la web). */
export function PlanesScreen() {
  const router = useRouter();
  const { data, isLoading, error, reload } = useRecurso(saasApi.getPlanes, true, 'No se pudieron cargar los planes');
  const [moneda, setMoneda] = useState<Moneda>('BOB');
  const planes = data ?? [];

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScreenHeader title="Planes" subtitle="Abrí tu tienda online con MirrorIA" showLogo={false} showBack />
      <ScrollView contentContainerClassName="p-4 gap-4 pb-10">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-foreground">Elegí el plan de tu tienda</Text>
          <Text className="text-sm text-muted-foreground">
            Todos arrancan con días de prueba gratis. Podés cambiar de plan durante la prueba.
          </Text>
        </View>
        <View className="flex-row self-start rounded-full border border-border p-1">
          {(['BOB', 'USD'] as Moneda[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMoneda(m)}
              aria-pressed={moneda === m}
              className={cn('rounded-full px-4 py-1.5', moneda === m && 'bg-primary')}
            >
              <Text className={cn('text-xs font-semibold', moneda === m ? 'text-primary-foreground' : 'text-foreground')}>
                {m === 'BOB' ? 'Bolivianos' : 'Dólares'}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading && <Cargando texto="Cargando planes…" />}
        {error && !isLoading && <ErrorVista mensaje={error} onReintentar={reload} />}
        {planes.map((plan) => (
          <TarjetaPlan
            key={plan.id}
            plan={plan}
            moneda={moneda}
            destacado={esDestacado(plan, planes)}
            onElegir={() => router.push({ pathname: '/saas/registro', params: { plan: plan.codigo } })}
          />
        ))}

        {planes.length > 0 && (
          <View className="gap-2 rounded-2xl border border-border bg-card p-4">
            <Text className="text-sm font-semibold text-foreground">Incluido en todos los planes</Text>
            {INCLUIDO_EN_TODOS.map((i) => (
              <View key={i} className="flex-row items-center gap-2">
                <Icon as={Check} size={14} className="text-primary" />
                <Text className="text-sm text-foreground">{i}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TarjetaPlan({ plan, moneda, destacado, onElegir }: { plan: PlanDto; moneda: Moneda; destacado: boolean; onElegir: () => void }) {
  const precio = moneda === 'BOB' ? precioPlanBs(plan.precioMensualCents) : precioPlanUsd(plan.precioMensualUsdCents);
  return (
    <View className={cn('gap-3 rounded-3xl border bg-card p-5', destacado ? 'border-primary' : 'border-border')}>
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-foreground">{plan.nombre}</Text>
        {destacado && (
          <View className="rounded-full bg-primary px-2.5 py-0.5">
            <Text className="text-[11px] font-semibold text-primary-foreground">Más elegido</Text>
          </View>
        )}
      </View>
      {plan.descripcion ? <Text className="text-sm text-muted-foreground">{plan.descripcion}</Text> : null}
      <Text className="text-3xl font-bold text-foreground">
        {precio}
        <Text className="text-sm font-normal text-muted-foreground"> por mes</Text>
      </Text>
      <View className="gap-1.5">
        {FILAS_LIMITES.map((f) => (
          <View key={f.clave} className="flex-row items-center gap-2">
            <Icon as={Check} size={14} className="text-primary" />
            <Text className="text-sm text-foreground">{formatLimite(plan.limites[f.clave], f.singular, f.plural)}</Text>
          </View>
        ))}
        {plan.nivelMarca && (
          <View className="flex-row items-start gap-2">
            <Icon as={Check} size={14} className="mt-0.5 text-primary" />
            <Text className="flex-1 text-sm text-foreground">Personalización: {NIVELES[plan.nivelMarca]?.resumen}</Text>
          </View>
        )}
        <Text className="text-xs text-muted-foreground">{plan.diasPrueba} días de prueba gratis</Text>
      </View>
      <Button variant={destacado ? 'default' : 'outline'} size="lg" onPress={onElegir}>
        <Text>Empezar con {plan.nombre}</Text>
      </Button>
    </View>
  );
}
