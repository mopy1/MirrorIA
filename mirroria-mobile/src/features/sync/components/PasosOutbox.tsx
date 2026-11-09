import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { EstadoOutbox } from '@/lib/outbox/tipos';
import { cn } from '@/lib/utils';

const FINAL: Record<EstadoOutbox, { texto: string; color: string }> = {
  PENDIENTE: { texto: 'Confirmada', color: 'bg-border' },
  ENVIANDO: { texto: 'Confirmada', color: 'bg-border' },
  CONFIRMADA: { texto: 'Confirmada', color: 'bg-success' },
  COMPENSADA: { texto: 'Compensada', color: 'bg-danger' },
  RECHAZADA: { texto: 'Rechazada', color: 'bg-muted-foreground' },
};

/** Línea de tiempo compacta en la fila: Pendiente → Enviando → Confirmada/Compensada/Rechazada. */
export function PasosOutbox({ estado, envios }: { estado: EstadoOutbox; envios: number }) {
  const pasos = [
    { texto: 'Pendiente', color: 'bg-warning' },
    { texto: envios > 1 ? `Enviando ×${envios}` : 'Enviando', color: envios > 0 || estado === 'ENVIANDO' ? 'bg-info' : 'bg-border' },
    FINAL[estado],
  ];
  return (
    <View className="flex-row items-center">
      {pasos.map((p, i) => (
        <View key={i} className={cn('flex-row items-center', i < 2 && 'flex-1')}>
          <View className={cn('h-2 w-2 rounded-full', p.color)} />
          <Text className="ml-1 text-[10px] text-muted-foreground">{p.texto}</Text>
          {i < 2 ? <View className="mx-1.5 h-px flex-1 bg-border" /> : null}
        </View>
      ))}
    </View>
  );
}
