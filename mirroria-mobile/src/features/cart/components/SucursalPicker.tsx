import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { sucursalesApi } from '@/src/features/sucursales/api/sucursalesApi';
import type { SucursalResponseDto } from '@/src/features/sucursales/types/sucursales.types';

interface SucursalPickerProps {
  value: string | null;
  onChange: (sucursalId: string) => void;
}

export function SucursalPicker({ value, onChange }: SucursalPickerProps) {
  const [sucursales, setSucursales] = useState<SucursalResponseDto[]>([]);

  useEffect(() => {
    sucursalesApi
      .getSucursales()
      .then((data) => {
        const activas = data.filter((s) => s.activo);
        setSucursales(activas);
        if (activas.length === 1) onChange(activas[0].id);
      })
      .catch(() => setSucursales([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="gap-2">
      <Text className="text-xs font-bold text-foreground">
        ¿En qué sucursal retirás/probás?
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {sucursales.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => onChange(s.id)}
            className={`px-3 py-1.5 rounded-lg border ${
              value === s.id ? 'bg-primary border-primary' : 'bg-card border-border/70'
            }`}
          >
            <Text
              className={`text-[11px] font-semibold ${
                value === s.id ? 'text-primary-foreground' : 'text-foreground'
              }`}
            >
              {s.nombre}
            </Text>
          </Pressable>
        ))}
        {sucursales.length === 0 && (
          <Text className="text-[11px] text-muted-foreground">
            No hay sucursales disponibles.
          </Text>
        )}
      </View>
    </View>
  );
}
