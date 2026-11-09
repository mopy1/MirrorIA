import { View } from 'react-native';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Titulo } from '@/components/common/Titulo';
import { Text } from '@/components/ui/text';
import type { FichaPrenda, VarianteFicha } from '@/lib/db/tipos-espejo';

/** Categoría, nombre, precio (mono) y descripción; SKU de la variante en mono pequeño. */
export function InfoPrenda({ ficha, variante }: { ficha: FichaPrenda; variante?: VarianteFicha }) {
  const p = ficha.producto;
  return (
    <View className="gap-2">
      {ficha.categoria ? <Text className="text-xs text-muted-foreground">{ficha.categoria}</Text> : null}
      <View className="flex-row items-start justify-between gap-4">
        <Titulo nivel="h1" className="flex-1">
          {p.titulo}
        </Titulo>
        <MonedaBs cents={p.precioCents} className="mt-1.5 text-base" />
      </View>
      {p.descripcion ? <Text className="text-sm leading-5 text-muted-foreground">{p.descripcion}</Text> : null}
      {variante ? (
        <Text className="font-mono text-[11px] text-muted-foreground" style={{ fontVariant: ['tabular-nums'] }}>
          SKU {variante.sku}
        </Text>
      ) : null}
    </View>
  );
}
