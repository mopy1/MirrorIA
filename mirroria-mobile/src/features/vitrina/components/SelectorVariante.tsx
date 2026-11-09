import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { VarianteFicha } from '@/lib/db/tipos-espejo';
import { cn } from '@/lib/utils';
import { libreTotal } from '../hooks/use-seleccion-variante';

interface Props {
  colores: { nombre: string; hex: string | null }[];
  color?: string;
  tallas: VarianteFicha[];
  variante?: VarianteFicha;
  onColor: (c: string) => void;
  onTalla: (t: string) => void;
}

/** Color (muestras con nombre) y talla (chips de 48 px; agotada tachada pero elegible para "Avisame"). */
export function SelectorVariante({ colores, color, tallas, variante, onColor, onTalla }: Props) {
  return (
    <View className="gap-5">
      <View className="gap-2.5">
        <Text className="text-xs text-muted-foreground">
          Color · <Text className="font-body-semibold text-xs text-foreground">{color}</Text>
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {colores.map((c) => (
            <Pressable key={c.nombre} onPress={() => onColor(c.nombre)} accessibilityRole="button" accessibilityLabel={`Color ${c.nombre}`} accessibilityState={{ selected: c.nombre === color }}
              className={cn('h-11 w-11 items-center justify-center rounded-full border-2', c.nombre === color ? 'border-foreground' : 'border-transparent')}>
              <View className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: c.hex ?? '#999' }} />
            </Pressable>
          ))}
        </View>
      </View>
      <View className="gap-2.5">
        <Text className="text-xs text-muted-foreground">Talla</Text>
        <View className="flex-row flex-wrap gap-2">
          {tallas.map((t) => {
            const sel = t.id === variante?.id;
            const agotada = libreTotal(t) <= 0;
            return (
              <Pressable key={t.id} onPress={() => onTalla(t.talla)} accessibilityRole="button" accessibilityLabel={`Talla ${t.talla}${agotada ? ', agotada' : ''}`} accessibilityState={{ selected: sel }}
                className={cn('h-12 min-w-14 items-center justify-center rounded-md border px-4', sel ? 'border-foreground bg-foreground' : 'border-border')}>
                <Text className={cn('font-body-semibold text-sm', sel ? 'text-background' : agotada ? 'text-muted-foreground line-through' : 'text-foreground')}>{t.talla}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
