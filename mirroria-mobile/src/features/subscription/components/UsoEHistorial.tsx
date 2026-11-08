import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/src/lib/money';
import { FILAS_LIMITES, NIVELES, porcentajeUso } from '../../saas/lib/limites';
import type { LimitesPlanDto, NivelMarca, SuscripcionDto, UsoPlanDto } from '../../saas/types/saas.types';
import { ETIQUETA_ESTADO, formatFecha } from '../lib/cobro';

/** Medidores de uso contra los topes del plan (sucursales, prendas, cuentas del equipo). */
export function UsoPlan({ uso, limites }: { uso: UsoPlanDto; limites: LimitesPlanDto }) {
  return (
    <View className="gap-3">
      {FILAS_LIMITES.map((f) => {
        const usado = uso[f.uso];
        const tope = limites[f.clave];
        const pct = porcentajeUso(usado, tope);
        return (
          <View key={f.clave} className="gap-1.5">
            <View className="flex-row justify-between">
              <Text className="text-sm text-foreground">{f.titulo}</Text>
              <Text className="text-sm font-semibold text-foreground">{tope === null ? `${usado} · ilimitadas` : `${usado} de ${tope}`}</Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-muted">
              <View
                className={cn('h-full rounded-full', pct !== null && pct >= 100 ? 'bg-destructive' : pct !== null && pct >= 80 ? 'bg-amber-500' : 'bg-primary')}
                style={{ width: `${pct ?? 8}%` }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Qué se puede personalizar de la marca con este plan. */
export function IncluyeMarca({ nivel }: { nivel: NivelMarca }) {
  const n = NIVELES[nivel];
  return (
    <View className="gap-1 rounded-2xl bg-muted/50 p-4">
      <Text className="text-sm font-semibold text-foreground">Personalización de tu marca</Text>
      <Text className="text-sm text-muted-foreground">{n?.incluye}</Text>
    </View>
  );
}

/** Historial de períodos (más nuevos primero), como lista de tarjetas. */
export function Historial({ historial }: { historial: SuscripcionDto[] }) {
  if (historial.length === 0) return <Text className="text-sm text-muted-foreground">Todavía no hay movimientos.</Text>;
  return (
    <View className="gap-2">
      {historial.map((s) => (
        <View key={s.id} className="flex-row items-center justify-between rounded-xl border border-border p-3">
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold text-foreground">
              {s.plan.nombre} · {ETIQUETA_ESTADO[s.estado]}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {formatFecha(s.inicio)} – {formatFecha(s.fin)}
              {s.proveedorPago ? ` · ${s.proveedorPago}` : ''}
            </Text>
          </View>
          <Text className="text-sm font-medium text-foreground">{formatMoney(s.precioCents)}</Text>
        </View>
      ))}
    </View>
  );
}
