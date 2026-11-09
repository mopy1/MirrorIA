import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { etiquetaEstadoReserva } from '@/lib/reservas/comprar-reserva';
import { cn } from '@/lib/utils';

const ESTILO: Record<string, { fondo: string; texto: string }> = {
  PENDIENTE: { fondo: 'bg-warning/15', texto: 'text-warning' },
  CONFIRMADA: { fondo: 'bg-info/10', texto: 'text-info' },
  EN_TIENDA: { fondo: 'bg-primary', texto: 'text-primary-foreground' },
  COMPLETADA: { fondo: 'bg-success/10', texto: 'text-success' },
};
const APAGADO = { fondo: 'bg-muted', texto: 'text-muted-foreground' };

/** Estado de una reserva con texto (nunca solo color). */
export function BadgeEstadoReserva({ estado, className }: { estado: string; className?: string }) {
  const e = ESTILO[estado] ?? APAGADO;
  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', e.fondo, className)}>
      <Text className={cn('font-body-semibold text-[11px]', e.texto)}>{etiquetaEstadoReserva(estado)}</Text>
    </View>
  );
}
