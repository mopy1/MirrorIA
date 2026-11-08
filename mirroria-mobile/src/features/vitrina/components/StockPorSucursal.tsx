import { MapPin } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { VarianteFicha } from '@/lib/db/tipos-espejo';
import { cn } from '@/lib/utils';

function etiqueta(libre: number) {
  if (libre <= 0) return { texto: 'Agotada', clase: 'bg-danger/10 text-danger' };
  if (libre === 1) return { texto: 'Última unidad', clase: 'bg-warning/15 text-warning' };
  if (libre <= 2) return { texto: `Últimas ${libre}`, clase: 'bg-warning/15 text-warning' };
  return { texto: `${libre} disponibles`, clase: 'bg-success/10 text-success' };
}

/** Stock libre de la talla elegida en cada sucursal (desde el espejo: funciona sin red). */
export function StockPorSucursal({ variante }: { variante?: VarianteFicha }) {
  if (!variante) return null;
  return (
    <View className="gap-1">
      <Text className="mb-1 text-xs text-muted-foreground">Dónde está tu talla {variante.talla}</Text>
      {variante.stock.length === 0 ? (
        <Text className="text-sm text-muted-foreground">Sin stock cargado en ninguna sucursal.</Text>
      ) : (
        variante.stock.map((s) => {
          const e = etiqueta(s.libre);
          return (
            <View key={s.sucursalId} className="min-h-14 flex-row items-center gap-3 border-b border-border py-2">
              <Icon as={MapPin} size={18} weight="duotone" className="text-muted-foreground" />
              <View className="flex-1">
                <Text className="font-body-medium text-sm">{s.sucursalNombre}</Text>
                <Text className="text-xs text-muted-foreground">{s.ciudad}</Text>
              </View>
              <View className={cn('rounded-full px-2.5 py-1', e.clase.split(' ')[0])}>
                <Text className={cn('font-body-semibold text-xs', e.clase.split(' ')[1])}>{e.texto}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
