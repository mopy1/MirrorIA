import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/src/lib/money';
import { ETIQUETA_ESTADO, formatFecha, textoDiasRestantes } from '../lib/cobro';
import type { MiSuscripcionDto } from '../types/suscripcion.types';

const COLOR_ESTADO: Record<string, string> = {
  TRIAL: 'bg-sky-500/10 text-sky-700',
  ACTIVA: 'bg-emerald-500/10 text-emerald-700',
  VENCIDA: 'bg-destructive/10 text-destructive',
  CANCELADA: 'bg-muted text-muted-foreground',
};

/** Plan, estado y vigencia de la suscripción más reciente. */
export function PlanActualCard({ data, children }: { data: MiSuscripcionDto; children?: React.ReactNode }) {
  const { plan, suscripcion } = data;
  const enPrueba = suscripcion.estado === 'TRIAL';
  return (
    <View className="gap-4 rounded-3xl border border-primary/30 bg-card p-5">
      <View className="gap-1">
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plan actual</Text>
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-2xl font-bold text-foreground">{plan.nombre}</Text>
          <View className={cn('rounded-full px-2.5 py-0.5', COLOR_ESTADO[suscripcion.estado])}>
            <Text className={cn('text-xs font-semibold', COLOR_ESTADO[suscripcion.estado])}>{ETIQUETA_ESTADO[suscripcion.estado]}</Text>
          </View>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <Dato titulo="Precio" valor={`${formatMoney(suscripcion.precioCents)} / mes`} />
        <Dato titulo={enPrueba ? 'La prueba termina' : 'Vigente hasta'} valor={formatFecha(suscripcion.fin)} />
        <Dato titulo="Días restantes" valor={textoDiasRestantes(suscripcion.diasRestantes)} />
      </View>
      {children}
    </View>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <View className="min-w-[30%] flex-1 rounded-xl bg-muted/50 p-3">
      <Text className="text-[11px] text-muted-foreground">{titulo}</Text>
      <Text className="text-sm font-semibold text-foreground">{valor}</Text>
    </View>
  );
}
