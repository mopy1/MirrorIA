import { View } from 'react-native';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Text } from '@/components/ui/text';

export interface LineaCompra {
  prenda: string;
  talla: string;
  color: string;
  cantidad: number;
  precioCents: number;
}

/** Renglones del ticket: prenda, talla/color × n y subtotal en mono. */
export function LineasCompra({ lineas }: { lineas: LineaCompra[] }) {
  return (
    <View>
      {lineas.map((l, i) => (
        <View key={`${l.prenda}-${l.talla}-${i}`} className="min-h-14 flex-row items-center gap-3 border-b border-dashed border-border py-2.5">
          <View className="flex-1">
            <Text className="font-body-medium text-sm" numberOfLines={1}>
              {l.prenda}
            </Text>
            <Text className="text-xs text-muted-foreground">
              Talla {l.talla} · {l.color} · × {l.cantidad}
            </Text>
          </View>
          <MonedaBs cents={l.precioCents * l.cantidad} />
        </View>
      ))}
    </View>
  );
}
