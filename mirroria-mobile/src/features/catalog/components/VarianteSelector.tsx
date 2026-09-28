import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import type { VarianteResponseDto } from '../types/catalog.types';

interface VarianteSelectorProps {
  variantes: VarianteResponseDto[];
  selectedId: string | null;
  onSelect: (varianteId: string) => void;
}

export function VarianteSelector({
  variantes,
  selectedId,
  onSelect,
}: VarianteSelectorProps) {
  if (variantes.length === 0) {
    return (
      <Text className="text-xs text-muted-foreground">
        Esta prenda no tiene variantes disponibles todavía.
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {variantes.map((v) => {
        const active = v.id === selectedId;
        return (
          <Pressable
            key={v.id}
            onPress={() => onSelect(v.id)}
            disabled={!v.activo}
            className={`px-3.5 py-2 rounded-xl border ${
              active
                ? 'bg-primary border-primary'
                : 'bg-card border-border/70'
            } ${!v.activo ? 'opacity-40' : ''}`}
          >
            <Text
              className={`text-xs font-semibold ${
                active ? 'text-primary-foreground' : 'text-foreground'
              }`}
            >
              {v.tallaNombre} · {v.colorNombre}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
