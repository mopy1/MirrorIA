import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const ESTILO: Record<string, { texto: string; fondo: string; color: string }> = {
  PENDIENTE: { texto: 'Falta pagar', fondo: 'bg-warning/15', color: 'text-warning' },
  PAGADA: { texto: 'Pagada', fondo: 'bg-success/10', color: 'text-success' },
  ENTREGADA: { texto: 'Entregada', fondo: 'bg-success/10', color: 'text-success' },
  CANCELADA: { texto: 'Cancelada', fondo: 'bg-muted', color: 'text-muted-foreground' },
  DEVUELTA_TOTAL: { texto: 'Devuelta', fondo: 'bg-muted', color: 'text-muted-foreground' },
  DEVUELTA_PARCIAL: { texto: 'Devuelta en parte', fondo: 'bg-muted', color: 'text-muted-foreground' },
};

/** Estado de pago de un pedido, en palabras de la clienta. */
export function BadgeEstadoVenta({ estado, className }: { estado: string; className?: string }) {
  const e = ESTILO[estado] ?? { texto: estado, fondo: 'bg-muted', color: 'text-muted-foreground' };
  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', e.fondo, className)}>
      <Text className={cn('font-body-semibold text-[11px]', e.color)}>{e.texto}</Text>
    </View>
  );
}
