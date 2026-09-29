import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { MapPin, Navigation, Phone } from 'lucide-react-native';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { sucursalesApi } from '../api/sucursalesApi';
import type { SucursalResponseDto } from '../types/sucursales.types';

export function SucursalesScreen() {
  const [sucursales, setSucursales] = useState<SucursalResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sucursalesApi
      .getSucursales()
      .then((data) => setSucursales(data.filter((s) => s.activo)))
      .catch(() => setSucursales([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Sucursales & Probadores" showLogo={false} showBack />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8a1538" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {sucursales.map((s) => (
            <View
              key={s.id}
              className="p-4 rounded-2xl bg-card border border-border/70 gap-2"
            >
              <Text className="text-sm font-bold text-foreground">{s.nombre}</Text>
              <View className="flex-row items-center gap-1.5">
                <Icon as={MapPin} size={13} className="text-muted-foreground" />
                <Text className="text-[11px] text-muted-foreground flex-1">
                  {s.direccion}, {s.ciudadNombre}
                </Text>
              </View>
              {s.telefono && (
                <View className="flex-row items-center gap-1.5">
                  <Icon as={Phone} size={13} className="text-muted-foreground" />
                  <Text className="text-[11px] text-muted-foreground">{s.telefono}</Text>
                </View>
              )}
              <View className="flex-row gap-2 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${s.nombre}, ${s.direccion}, ${s.ciudadNombre}, Bolivia`
                      )}`
                    )
                  }
                >
                  <Icon as={Navigation} size={14} className="text-foreground" />
                  <Text>Cómo llegar</Text>
                </Button>
                {s.telefono && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onPress={() => Linking.openURL(`tel:${s.telefono!.replace(/[^\d+]/g, '')}`)}
                  >
                    <Icon as={Phone} size={14} className="text-foreground" />
                    <Text>Llamar</Text>
                  </Button>
                )}
              </View>
            </View>
          ))}
          {sucursales.length === 0 && (
            <Text className="text-sm text-muted-foreground text-center mt-10">
              No hay sucursales disponibles.
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}
