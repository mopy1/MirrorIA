import { ArrowsClockwise } from 'phosphor-react-native';
import { ActivityIndicator, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { OutboxManager } from '@/lib/outbox/outbox-manager';
import { useEstadoOutbox } from '@/lib/outbox/use-outbox';
import { useEstadoRed } from '@/lib/red/use-estado-red';

/** Cuántas faltan, qué está pasando y la acción primaria "Sincronizar ahora". */
export function ResumenSync({ pendientes, conSesion }: { pendientes: number; conSesion: boolean }) {
  const red = useEstadoRed();
  const estado = useEstadoOutbox();
  const { colores } = useTema();
  const texto = !conSesion
    ? 'Iniciá sesión para enviarlas'
    : estado.pausada
      ? 'En pausa: tu sesión venció, iniciá sesión de nuevo'
      : estado.sincronizando
        ? 'Enviando a la tienda…'
        : !red.online
          ? 'Se envían solas cuando vuelva la red'
          : pendientes
            ? 'Reintentando con espera creciente (2 → 30 s)'
            : 'Todo enviado';
  return (
    <View className="mx-5 gap-3">
      <View className="flex-row items-baseline gap-2">
        <Text className="font-mono text-[32px] leading-9" style={{ fontVariant: ['tabular-nums'] }}>
          {pendientes}
        </Text>
        <Text className="text-sm text-muted-foreground">{pendientes === 1 ? 'operación por enviar' : 'operaciones por enviar'}</Text>
      </View>
      <Text className="text-xs text-muted-foreground">{texto}</Text>
      <Button size="lg" className="h-[52px]" disabled={!red.online || !conSesion || estado.sincronizando || pendientes === 0} onPress={() => void OutboxManager.procesarCola(true)}>
        {estado.sincronizando ? <ActivityIndicator color={colores['primary-foreground']} /> : <Icon as={ArrowsClockwise} size={18} weight="bold" className="text-primary-foreground" />}
        <Text>Sincronizar ahora</Text>
      </Button>
    </View>
  );
}
