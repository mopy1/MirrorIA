import { BellSlash } from 'phosphor-react-native';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** Notificaciones apagadas: los avisos igual se ven acá, pero no llegan al teléfono. */
export function BannerPermiso({ onActivar }: { onActivar: () => void }) {
  return (
    <View className="mx-5 mb-2 flex-row items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3">
      <Icon as={BellSlash} size={20} className="text-warning" />
      <Text className="flex-1 text-xs leading-4">Las notificaciones están apagadas: vas a ver acá cuando vuelva, pero no te va a llegar el aviso.</Text>
      <Button size="sm" variant="outline" onPress={onActivar}>
        <Text>Activar</Text>
      </Button>
    </View>
  );
}
