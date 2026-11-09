import { BellRinging, Hourglass } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { estadoAviso } from '@/lib/avisos/decidir-avisos';
import { cn } from '@/lib/utils';

/** Badge semántico del aviso, siempre con texto: "Esperando reposición" (ámbar) o "Volvió · N" (verde). */
export function BadgeAviso({ libre }: { libre: number }) {
  const volvio = estadoAviso({ libre }) === 'VOLVIO';
  const color = volvio ? 'text-success' : 'text-warning';
  return (
    <View className={cn('flex-row items-center gap-1 self-start rounded-full px-2.5 py-1', volvio ? 'bg-success/10' : 'bg-warning/15')}>
      <Icon as={volvio ? BellRinging : Hourglass} size={13} weight="bold" className={color} />
      <Text className={cn('font-body-semibold text-[11px]', color)}>
        {volvio ? `Volvió · ${libre === 1 ? 'última unidad' : `${libre} disponibles`}` : 'Esperando reposición'}
      </Text>
    </View>
  );
}
