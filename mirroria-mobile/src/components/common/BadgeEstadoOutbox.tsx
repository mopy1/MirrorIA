import { CheckCircle, Clock, CloudArrowUp, Prohibit, XCircle } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon, type PhosphorIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { EstadoOutbox } from '@/lib/outbox/tipos';
import { cn } from '@/lib/utils';

const ESTILO: Record<EstadoOutbox, { texto: string; icono: PhosphorIcon; fondo: string; color: string }> = {
  PENDIENTE: { texto: 'Pendiente de confirmar', icono: Clock, fondo: 'bg-warning/15', color: 'text-warning' },
  ENVIANDO: { texto: 'Enviando…', icono: CloudArrowUp, fondo: 'bg-info/10', color: 'text-info' },
  CONFIRMADA: { texto: 'Confirmada', icono: CheckCircle, fondo: 'bg-success/10', color: 'text-success' },
  COMPENSADA: { texto: 'Anulada: se agotó', icono: XCircle, fondo: 'bg-danger/10', color: 'text-danger' },
  RECHAZADA: { texto: 'No se pudo', icono: Prohibit, fondo: 'bg-muted', color: 'text-muted-foreground' },
};

/**
 * RN09 (spec §5.5): lo encolado es "Pendiente de confirmar" (nunca "Comprado") hasta que el
 * servidor concilia. Mismo badge en carrito, pendientes y comprobantes; siempre con texto.
 */
export function BadgeEstadoOutbox({ estado, texto, className }: { estado: EstadoOutbox; texto?: string; className?: string }) {
  const e = ESTILO[estado];
  return (
    <View className={cn('flex-row items-center gap-1 self-start rounded-full px-2.5 py-1', e.fondo, className)}>
      <Icon as={e.icono} size={13} weight="bold" className={e.color} />
      <Text className={cn('font-body-semibold text-[11px]', e.color)}>{texto ?? e.texto}</Text>
    </View>
  );
}
