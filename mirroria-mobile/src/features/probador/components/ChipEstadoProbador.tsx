import { Sparkle } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatoCuenta, type FaseProbador } from '@/lib/probador/fase-probador';
import { cn } from '@/lib/utils';

const TEXTO: Partial<Record<FaseProbador, string>> = {
  'abriendo-camara': 'Abriendo cámara',
  conectando: 'Conectando',
  permiso: 'Pidiendo permiso',
};

/** Píldora sobre el video: punto lima "En vivo · 0:42" o el paso en curso. */
export function ChipEstadoProbador({ fase, restante }: { fase: FaseProbador; restante: number }) {
  const enVivo = fase === 'en-vivo';
  const texto = enVivo ? `En vivo · ${formatoCuenta(restante)}` : (TEXTO[fase] ?? 'Probador con IA');
  return (
    <View className="flex-row items-center gap-2 self-start rounded-full bg-black/55 px-3 py-1.5" accessibilityLiveRegion="polite">
      {enVivo ? <View className={cn('h-2 w-2 rounded-full bg-success')} /> : <Icon as={Sparkle} size={13} weight="fill" className="text-white" />}
      <Text className="font-body-semibold text-xs text-white">{texto}</Text>
    </View>
  );
}
