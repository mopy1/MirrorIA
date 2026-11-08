import { router } from 'expo-router';
import { CaretRight } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { BadgeEstadoOutbox } from '@/components/common/BadgeEstadoOutbox';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { horaLaPaz } from '@/lib/formato/fechas';
import type { FilaOutbox } from '@/lib/outbox/tipos';
import { cn } from '@/lib/utils';
import { PasosOutbox } from './PasosOutbox';

const BORDE = { PENDIENTE: 'border-warning/40', ENVIANDO: 'border-info/40', CONFIRMADA: 'border-border', COMPENSADA: 'border-danger/40', RECHAZADA: 'border-border' };

/** Una operación de la outbox: estado, qué es, clave corta, hora, reintentos y pasos. Tocar abre su comprobante. */
export function FilaOperacion({ fila }: { fila: FilaOutbox }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/mis-cosas/pendientes/[outboxId]', params: { outboxId: fila.id } })}
      accessibilityRole="button"
      className={cn('mx-5 gap-2.5 rounded-lg border bg-card p-4 active:opacity-80', BORDE[fila.estado])}
    >
      <View className="flex-row items-center justify-between">
        <BadgeEstadoOutbox estado={fila.estado} />
        <Icon as={CaretRight} size={16} className="text-muted-foreground" />
      </View>
      <Text className="font-body-medium text-sm" numberOfLines={2}>
        {fila.descripcion}
      </Text>
      <Text className="font-mono text-[11px] text-muted-foreground">
        Clave {fila.idempotencyKey.slice(0, 8)} · {horaLaPaz(fila.creadoEn)} · {fila.reintentos} {fila.reintentos === 1 ? 'reintento' : 'reintentos'}
        {fila.codigoRespuesta ? ` · HTTP ${fila.codigoRespuesta}` : ''}
      </Text>
      {fila.ultimoError && fila.estado !== 'CONFIRMADA' ? (
        <Text className={cn('text-xs leading-4', fila.estado === 'COMPENSADA' ? 'text-danger' : 'text-muted-foreground')}>{fila.ultimoError}</Text>
      ) : null}
      <PasosOutbox estado={fila.estado} envios={fila.envios ?? 0} />
    </Pressable>
  );
}
