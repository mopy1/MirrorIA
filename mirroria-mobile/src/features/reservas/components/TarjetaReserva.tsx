import { CaretRight } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { horaLaPaz, partesFechaLaPaz } from '@/lib/formato/fechas';
import { cn } from '@/lib/utils';

interface Props {
  fechaIso: string;
  titulo: string;
  detalle: string;
  badge: React.ReactNode;
  apagada?: boolean;
  onPress: () => void;
}

/** Fila de reserva con bloque de calendario (día/mes) a la izquierda: se escanea por fecha. */
export function TarjetaReserva({ fechaIso, titulo, detalle, badge, apagada, onPress }: Props) {
  const ms = Date.parse(fechaIso);
  const f = partesFechaLaPaz(ms);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="flex-row items-center gap-4 rounded-lg border border-border bg-card p-3 active:bg-accent">
      <View className={cn('h-16 w-14 items-center justify-center rounded-md', apagada ? 'bg-muted' : 'bg-primary/10')}>
        <Text className={cn('text-[11px] uppercase', apagada ? 'text-muted-foreground' : 'text-primary')}>{f.dia}</Text>
        <Text className={cn('font-mono text-xl leading-6', apagada ? 'text-muted-foreground' : 'text-primary')}>{f.num}</Text>
        <Text className={cn('text-[11px] uppercase', apagada ? 'text-muted-foreground' : 'text-primary')}>{f.mes}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-body-semibold text-[15px]" numberOfLines={1}>
          {titulo}
        </Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {horaLaPaz(ms)} · {detalle}
        </Text>
        {badge}
      </View>
      <Icon as={CaretRight} size={16} className="text-muted-foreground" />
    </Pressable>
  );
}
