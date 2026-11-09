import { CloudCheck } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haceCuanto } from '@/lib/formato/fechas';

/** Transparencia del espejo: cuándo se guardó y cuántas prendas hay en el teléfono. */
export function PieVitrina({ ultimoSync, prendas, sincronizando }: { ultimoSync: number | null; prendas: number; sincronizando: boolean }) {
  return (
    <View className="flex-row items-center justify-center gap-2 px-5 pb-8 pt-2">
      <Icon as={CloudCheck} size={16} className="text-muted-foreground" />
      <Text className="text-xs text-muted-foreground">
        {sincronizando ? 'Actualizando la vitrina…' : `${prendas} prendas guardadas en el teléfono${ultimoSync ? ` · ${haceCuanto(ultimoSync)}` : ''}`}
      </Text>
    </View>
  );
}
