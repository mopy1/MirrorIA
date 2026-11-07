import { CloudSlash, WifiHigh } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { NetInfoListener } from '@/lib/red/net-info-listener';
import { useEstadoRed } from '@/lib/red/use-estado-red';

/** Modo demo "Sin red" (idea 3): corta TODA request antes del fetch sin tocar el Wi-Fi. */
export function InterruptorSinRed() {
  const red = useEstadoRed();
  const estado = red.modoSinRed ? 'Modo demo activo' : red.sinConexion ? 'El teléfono no tiene conexión' : 'Conectada a la tienda';
  return (
    <View className="mx-5 gap-4 rounded-lg border border-border p-4">
      <View className="flex-row items-center gap-3">
        <View className={red.online ? 'h-10 w-10 items-center justify-center rounded-full bg-success/10' : 'h-10 w-10 items-center justify-center rounded-full bg-warning/15'}>
          <Icon as={red.online ? WifiHigh : CloudSlash} size={20} weight="bold" className={red.online ? 'text-success' : 'text-warning'} />
        </View>
        <View className="flex-1">
          <Text className="font-body-semibold text-sm">{red.online ? 'Con conexión' : 'Sin conexión'}</Text>
          <Text className="text-xs text-muted-foreground">{estado}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3 border-t border-border pt-4">
        <View className="flex-1">
          <Text className="font-body-medium text-sm">Simular "Sin red"</Text>
          <Text className="text-xs leading-4 text-muted-foreground">Para la demo: la app actúa como en modo avión.</Text>
        </View>
        <Switch checked={red.modoSinRed} onCheckedChange={(v) => void NetInfoListener.ponerModoSinRed(v)} accessibilityLabel='Simular "Sin red"' />
      </View>
    </View>
  );
}
