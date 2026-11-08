import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { Color, Variante } from '../types/catalogo-admin.types';

/** Variantes de la prenda: talla, color (con su muestra) y SKU. */
export function VariantesLista({ variantes, colores }: { variantes: Variante[]; colores: Color[] }) {
  if (variantes.length === 0) {
    return <Text className="text-sm text-muted-foreground">Todavía no tiene variantes: agregá al menos una talla y color para poder venderla.</Text>;
  }
  return (
    <View className="gap-2">
      {variantes.map((v) => {
        const hex = colores.find((c) => c.id === v.colorId)?.hexCode;
        return (
          <View key={v.id} className="flex-row items-center gap-3 rounded-xl border border-border px-3 py-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Text className="text-sm font-bold">{v.tallaNombre}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                {hex ? <View className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: hex }} /> : null}
                <Text className="text-sm">{v.colorNombre}</Text>
              </View>
              <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>{v.sku}</Text>
            </View>
            {!v.activo ? <Text className="text-xs text-muted-foreground">Inactiva</Text> : null}
          </View>
        );
      })}
    </View>
  );
}
