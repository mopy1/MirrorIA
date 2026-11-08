import { router } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { PrendaProbable } from '@/lib/probador/prendas';

/** Con el video en vivo: ir a la ficha de lo que tiene puesto (primaria) o terminar la sesión. */
export function PieProbador({ prenda, onTerminar }: { prenda: PrendaProbable | null; onTerminar: () => void }) {
  return (
    <View className="flex-row gap-2 px-5">
      <Button size="lg" className="h-[52px] flex-1" disabled={!prenda} onPress={() => prenda && router.navigate({ pathname: '/vitrina/[productoId]', params: { productoId: prenda.id } })}>
        <Text>Ver esta prenda</Text>
      </Button>
      <Button size="lg" variant="outline" className="h-[52px] border-white/40 bg-transparent" onPress={onTerminar}>
        <Text className="text-white">Terminar</Text>
      </Button>
    </View>
  );
}
