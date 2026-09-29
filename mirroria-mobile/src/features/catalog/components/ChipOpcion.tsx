import React from 'react';
import { Pressable } from 'react-native';
import { Text } from '@/components/ui/text';

interface ChipOpcionProps {
  label: string;
  activo: boolean;
  onPress: () => void;
}

/** Chip de selección única (sucursal, horario) de la hoja de reserva. */
export function ChipOpcion({ label, activo, onPress }: ChipOpcionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-lg border ${
        activo ? 'bg-primary border-primary' : 'bg-background border-border/70'
      }`}
    >
      <Text
        className={`text-[11px] font-semibold ${
          activo ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
