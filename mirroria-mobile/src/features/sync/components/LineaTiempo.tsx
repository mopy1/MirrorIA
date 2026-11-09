import { View } from 'react-native';
import { BadgeEstadoOutbox } from '@/components/common/BadgeEstadoOutbox';
import { Text } from '@/components/ui/text';
import { horaLaPaz } from '@/lib/formato/fechas';
import type { EstadoOutbox, EventoOutbox } from '@/lib/outbox/tipos';
import { cn } from '@/lib/utils';

const PUNTO: Record<EstadoOutbox, string> = {
  PENDIENTE: 'bg-warning', ENVIANDO: 'bg-info', CONFIRMADA: 'bg-success', COMPENSADA: 'bg-danger', RECHAZADA: 'bg-muted-foreground',
};

/** Línea de tiempo vertical: cada transición con hora (La Paz), código HTTP y motivo. */
export function LineaTiempo({ eventos }: { eventos: EventoOutbox[] }) {
  return (
    <View>
      {eventos.map((e, i) => (
        <View key={i} className="flex-row gap-3">
          <View className="w-4 items-center">
            <View className={cn('mt-1.5 h-2.5 w-2.5 rounded-full', PUNTO[e.estado])} />
            {i < eventos.length - 1 ? <View className="w-px flex-1 bg-border" /> : null}
          </View>
          <View className="flex-1 gap-1 pb-4">
            <View className="flex-row items-center gap-2">
              <BadgeEstadoOutbox estado={e.estado} texto={e.estado === 'PENDIENTE' ? 'Pendiente' : undefined} />
              <Text className="font-mono text-xs text-muted-foreground">{horaLaPaz(e.en)}</Text>
              {e.codigo ? <Text className="font-mono text-xs text-muted-foreground">HTTP {e.codigo}</Text> : null}
            </View>
            {e.detalle ? <Text className="text-xs leading-4 text-muted-foreground">{e.detalle}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}
