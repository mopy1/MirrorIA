import { router } from 'expo-router';
import { CaretRight } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { BadgeEstadoOutbox } from '@/components/common/BadgeEstadoOutbox';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haceCuanto } from '@/lib/formato/fechas';
import type { FilaOutbox } from '@/lib/outbox/tipos';

/** Tarjeta arriba del carrito: la compra encolada (RN09) y acceso a su comprobante. */
export function AvisoCompraPendiente({ fila }: { fila: FilaOutbox }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/carrito/compra/[outboxId]', params: { outboxId: fila.id } })}
      accessibilityRole="button"
      className="mx-5 mb-2 flex-row items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4 active:opacity-80"
    >
      <View className="flex-1 gap-1.5">
        <BadgeEstadoOutbox estado={fila.estado} />
        <Text className="font-body-medium text-sm">{fila.descripcion}</Text>
        <Text className="text-xs text-muted-foreground">Guardada {haceCuanto(fila.creadoEn)} · se envía sola al volver la red</Text>
      </View>
      <Icon as={CaretRight} size={16} className="text-muted-foreground" />
    </Pressable>
  );
}
