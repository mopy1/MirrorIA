import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ticket } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatMoney } from '@/src/lib/money';
import { armarGruposClientas, type GrupoClientas } from '../lib/ml-clientas';
import { contar } from '../lib/ml-lenguaje';
import type { RfmSegmentosResponse } from '../types/ml.types';
import { BloqueMl } from './BloqueMl';

function Grupo({ g, puedeCrearCupon }: { g: GrupoClientas; puedeCrearCupon: boolean }) {
  const router = useRouter();
  return (
    <View className="gap-1.5 border-t border-border/70 pt-3">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="text-sm font-semibold">{g.nombre}</Text>
        <Text className="text-sm text-muted-foreground">
          {contar(g.cantidad, 'clienta', 'clientas')} · {g.porcentaje}%
        </Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-muted">
        <View className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(g.cantidad > 0 ? 2 : 0, g.porcentaje)}%` }} />
      </View>
      <Text className="text-sm text-muted-foreground">{g.significado}</Text>
      <Text className="text-sm">
        <Text className="text-sm font-medium">Qué hacer: </Text>
        {g.queHacer}
      </Text>
      {g.valorPorClientaBs !== null ? (
        <Text className="text-xs text-muted-foreground">
          Valor estimado por clienta: <Text className="text-xs font-medium">{formatMoney(g.valorPorClientaBs * 100)}</Text>
        </Text>
      ) : null}
      {g.nombres.length > 0 ? <Text className="text-xs text-muted-foreground">Por ejemplo: {g.nombres.join(', ')}</Text> : null}
      {g.conCupon && puedeCrearCupon && g.cantidad > 0 ? (
        <Button size="sm" variant="outline" className="self-start" onPress={() => router.push('/admin/cupones')}>
          <Icon as={Ticket} size={16} />
          <Text>Crear un cupón</Text>
        </Button>
      ) : null}
    </View>
  );
}

interface Props {
  data: RfmSegmentosResponse | null;
  isLoading: boolean;
  error: string | null;
  onReintentar: () => void;
  soloDuena: boolean;
}

/** "Tus clientas": 4 grupos con nombres humanos según cómo compran. */
export function SeccionClientas({ data, isLoading, error, onReintentar, soloDuena }: Props) {
  const grupos = useMemo(() => armarGruposClientas(data), [data]);
  const total = data?.total_clientas ?? 0;
  const dormidas = grupos.find((g) => g.id === 'EN_RIESGO_DORMIDAS')?.cantidad ?? 0;
  const frase =
    data && total > 0
      ? `Agrupamos a tus ${contar(total, 'clienta', 'clientas')} según cuándo, cuánto y qué tan seguido compran.${
          dormidas > 0 ? ` ${dormidas === 1 ? 'Una dejó' : `${dormidas} dejaron`} de comprar: es el grupo que más conviene recuperar.` : ''
        }`
      : undefined;

  return (
    <BloqueMl
      titulo="Tus clientas"
      frase={frase}
      isLoading={isLoading}
      error={error}
      hayDatos={!!data}
      que="los grupos de clientas"
      onReintentar={onReintentar}
      soloDuena={soloDuena}
      vacio={total === 0 ? { titulo: 'Todavía no hay clientas con compras', detalle: 'Cuando tus clientas empiecen a comprar, acá las vas a ver agrupadas para saber a quién cuidar y a quién recuperar.' } : null}>
      {grupos.map((g) => (
        <Grupo key={g.id} g={g} puedeCrearCupon={!soloDuena} />
      ))}
    </BloqueMl>
  );
}
