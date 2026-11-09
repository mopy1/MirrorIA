import React from 'react';
import { Linking, View } from 'react-native';
import { Info, MapPin } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ciudadesOrdenadas, sucursalesPorCiudad } from '../lib/sucursales';
import type { Ciudad, Sucursal } from '../types/sucursales-admin.types';

/** Pestaña "Ciudades" de la web: solo lectura, las administra la plataforma. */
export function CiudadesLista({ ciudades, sucursales }: { ciudades: Ciudad[]; sucursales: Sucursal[] }) {
  const cuenta = sucursalesPorCiudad(sucursales);
  return (
    <View className="gap-3">
      <View className="flex-row items-start gap-2 rounded-xl border border-border bg-muted/40 p-3">
        <Icon as={Info} size={16} className="text-muted-foreground mt-0.5" />
        <Text className="flex-1 text-sm text-muted-foreground">
          Estas son las ciudades habilitadas en MirrorIA para tus sucursales. ¿Falta tu ciudad?{' '}
          <Text
            className="text-sm font-medium text-primary"
            onPress={() => Linking.openURL('mailto:soporte@mirroria.app?subject=Nueva%20ciudad')}
          >
            Escribinos
          </Text>
        </Text>
      </View>
      <View className="rounded-2xl border border-border bg-card overflow-hidden">
        {ciudadesOrdenadas(ciudades).map((c, i) => (
          <View key={c.id} className={`flex-row items-center gap-3 px-4 py-3.5 ${i ? 'border-t border-border' : ''}`}>
            <Icon as={MapPin} size={18} className="text-primary" />
            <View className="flex-1">
              <Text className="text-base">{c.nombre}</Text>
              <Text className="text-xs text-muted-foreground">{c.pais}</Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              {cuenta[c.id] ? `${cuenta[c.id]} ${cuenta[c.id] === 1 ? 'sucursal' : 'sucursales'}` : 'Sin sucursales'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
