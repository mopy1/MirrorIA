import { ClockCounterClockwise } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haceCuanto } from '@/lib/formato/fechas';

/** CU46 4a: espejo de más de 7 días → "Datos desactualizados" (se sigue mostrando). */
export function AvisoEspejo({ ultimoSync, vencido }: { ultimoSync: number | null; vencido: boolean }) {
  if (!vencido || !ultimoSync) return null;
  return (
    <View className="mx-5 mt-4 flex-row items-center gap-3 rounded-lg bg-warning/10 p-3">
      <Icon as={ClockCounterClockwise} size={20} weight="duotone" className="text-warning" />
      <Text className="flex-1 text-xs leading-4">
        <Text className="font-body-semibold text-xs">Datos desactualizados.</Text> La vitrina se guardó {haceCuanto(ultimoSync)}; precios y stock pueden haber cambiado.
      </Text>
    </View>
  );
}
