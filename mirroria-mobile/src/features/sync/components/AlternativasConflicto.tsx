import { MapPin } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { DetalleConflicto } from '@/lib/outbox/tipos';

/** Dónde sí hay (otras sucursales con stock libre) y qué otras tallas quedan en esa sucursal (H6). */
export function AlternativasConflicto({ detalle }: { detalle: DetalleConflicto }) {
  const sucursales = detalle.alternativas?.otrasSucursales ?? [];
  const tallas = detalle.alternativas?.otrasTallas ?? [];
  if (sucursales.length === 0 && tallas.length === 0) {
    return <Text className="text-sm text-muted-foreground">No quedan unidades de esa talla en ninguna sucursal.</Text>;
  }
  return (
    <View className="gap-4">
      {sucursales.length > 0 ? (
        <View className="gap-1">
          <Text className="font-body-semibold text-xs uppercase tracking-wider text-muted-foreground">Hay en otras sucursales</Text>
          {sucursales.map((s) => (
            <View key={s.sucursalId} className="min-h-12 flex-row items-center gap-3 border-b border-border">
              <Icon as={MapPin} size={18} weight="duotone" className="text-primary" />
              <Text className="flex-1 font-body-medium text-sm">{s.sucursalNombre ?? 'Otra sucursal'}</Text>
              <Text className="font-mono text-xs text-success">{s.disponible} disp.</Text>
            </View>
          ))}
        </View>
      ) : null}
      {tallas.length > 0 ? (
        <View className="gap-2">
          <Text className="font-body-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Otras tallas en {detalle.sucursalNombre ?? 'esa sucursal'}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {tallas.map((t) => (
              <View key={t.varianteId} className="rounded-full border border-border px-3 py-1.5">
                <Text className="text-xs">
                  {t.talla ?? '—'} · <Text className="font-mono text-xs text-success">{t.disponible}</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
