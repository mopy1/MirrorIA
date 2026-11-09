import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';

/** Línea de estado "se actualiza sola" (spinner nativo, sin clases de animación de Tailwind: nativewind#1875). */
export function EsperandoPago({ texto }: { texto: string }) {
  const { colores } = useTema();
  return (
    <View className="flex-row items-center gap-2.5 rounded-full bg-info/10 px-4 py-2.5" accessibilityLiveRegion="polite">
      <ActivityIndicator size="small" color={colores.info} />
      <Text className="flex-1 text-xs leading-4 text-info">{texto}</Text>
    </View>
  );
}
