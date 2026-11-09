import React from 'react';
import { View } from 'react-native';
import { MapPin, Phone, Store } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { iniciales } from '@/src/features/admin-cupones/lib/comunes';
import type { Sucursal } from '../types/sucursales-admin.types';

/** Una fila de la tabla de sucursales de la web, hecha tarjeta. */
export function SucursalTarjeta({ sucursal }: { sucursal: Sucursal }) {
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="size-10 items-center justify-center rounded-full bg-primary/10">
          <Text className="text-xs font-semibold text-primary">{iniciales(sucursal.nombre)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold" numberOfLines={1}>
            {sucursal.nombre}
          </Text>
          <View className="flex-row items-center gap-1">
            <Icon as={Store} size={12} className="text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">Tienda física</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
          <Icon as={MapPin} size={12} className="text-muted-foreground" />
          <Text className="text-xs text-secondary-foreground">{sucursal.ciudadNombre}</Text>
        </View>
      </View>
      <Fila icono={MapPin} texto={sucursal.direccion} />
      <Fila icono={Phone} texto={sucursal.telefono || '—'} />
    </View>
  );
}

function Fila({ icono, texto }: { icono: typeof MapPin; texto: string }) {
  return (
    <View className="flex-row items-start gap-2">
      <Icon as={icono} size={14} className="text-muted-foreground mt-0.5" />
      <Text className="flex-1 text-sm text-muted-foreground">{texto}</Text>
    </View>
  );
}
