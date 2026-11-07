import { CaretRight } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { Icon, type PhosphorIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface Props {
  icono: PhosphorIcon;
  titulo: string;
  detalle?: string;
  onPress: () => void;
  peligro?: boolean;
}

/** Fila de navegación de 60 px (dedo cómodo), ícono en duotono y chevron. */
export function FilaEnlace({ icono, titulo, detalle, onPress, peligro }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="min-h-[60px] flex-row items-center gap-4 px-5 active:bg-accent">
      <Icon as={icono} size={22} weight="duotone" className={peligro ? 'text-danger' : 'text-primary'} />
      <View className="flex-1 border-b border-border py-4">
        <Text className={cn('font-body-medium text-[15px]', peligro && 'text-danger')}>{titulo}</Text>
        {detalle ? <Text className="mt-0.5 text-xs text-muted-foreground">{detalle}</Text> : null}
      </View>
      {!peligro ? <Icon as={CaretRight} size={16} className="text-muted-foreground" /> : null}
    </Pressable>
  );
}
