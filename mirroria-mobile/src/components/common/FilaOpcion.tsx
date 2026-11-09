import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface Props {
  titulo: string;
  detalle?: string;
  /** Texto a la derecha (estado del stock, hora…). */
  nota?: string;
  notaClase?: string;
  elegida: boolean;
  deshabilitada?: boolean;
  onPress: () => void;
}

/** Opción tipo radio de 56 px (dedo cómodo): sucursal de retiro, sucursal de la reserva… */
export function FilaOpcion({ titulo, detalle, nota, notaClase, elegida, deshabilitada, onPress }: Props) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      disabled={deshabilitada}
      accessibilityRole="radio"
      accessibilityState={{ checked: elegida, disabled: deshabilitada }}
      className={cn('min-h-14 flex-row items-center gap-3 rounded-lg border px-4 py-3', elegida ? 'border-primary bg-primary/5' : 'border-border', deshabilitada && 'opacity-50')}
    >
      <View className={cn('h-5 w-5 items-center justify-center rounded-full border-2', elegida ? 'border-primary' : 'border-muted-foreground/40')}>
        {elegida ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
      </View>
      <View className="flex-1">
        <Text className="font-body-medium text-sm">{titulo}</Text>
        {detalle ? <Text className="text-xs text-muted-foreground">{detalle}</Text> : null}
      </View>
      {nota ? <Text className={cn('max-w-[45%] text-right text-xs', notaClase ?? 'text-muted-foreground')}>{nota}</Text> : null}
    </Pressable>
  );
}
