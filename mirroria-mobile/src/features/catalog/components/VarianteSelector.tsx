import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import type { VarianteResponseDto } from '../types/catalog.types';

interface VarianteSelectorProps {
  variantes: VarianteResponseDto[];
  selectedId: string | null;
  onSelect: (varianteId: string | null) => void;
}

const ORDEN_TALLAS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

function ordenTalla(nombre: string): number {
  const i = ORDEN_TALLAS.indexOf(nombre.toUpperCase());
  // Tallas numéricas (36, 38...) o desconocidas van después, en orden natural.
  return i === -1 ? 100 + (parseFloat(nombre) || 0) : i;
}

/**
 * Color primero y talla después: más fácil de leer que una lista de
 * combinaciones "L · Negro" mezcladas. Las tallas que no existen (o no están
 * activas) en el color elegido quedan deshabilitadas.
 */
export function VarianteSelector({ variantes, selectedId, onSelect }: VarianteSelectorProps) {
  const colores = useMemo(() => [...new Set(variantes.map((v) => v.colorNombre))], [variantes]);
  const tallas = useMemo(
    () =>
      [...new Set(variantes.map((v) => v.tallaNombre))].sort((a, b) => ordenTalla(a) - ordenTalla(b)),
    [variantes]
  );
  const seleccionada = variantes.find((v) => v.id === selectedId);
  const [color, setColor] = useState<string | null>(colores.length === 1 ? colores[0] : null);
  const colorActivo = seleccionada?.colorNombre ?? color;

  if (variantes.length === 0) {
    return (
      <Text className="text-xs text-muted-foreground">
        Esta prenda no tiene variantes disponibles todavía.
      </Text>
    );
  }

  const elegirColor = (c: string) => {
    setColor(c);
    const misma = variantes.find(
      (v) => v.colorNombre === c && v.tallaNombre === seleccionada?.tallaNombre && v.activo
    );
    onSelect(misma?.id ?? null);
  };

  return (
    <View className="gap-3">
      <Fila titulo="Color">
        {colores.map((c) => (
          <Chip key={c} label={c} active={c === colorActivo} onPress={() => elegirColor(c)} />
        ))}
      </Fila>

      <Fila titulo={colorActivo ? 'Talla' : 'Talla (elegí un color primero)'}>
        {tallas.map((t) => {
          const v = variantes.find((x) => x.colorNombre === colorActivo && x.tallaNombre === t);
          return (
            <Chip
              key={t}
              label={t}
              active={!!v && v.id === selectedId}
              disabled={!v || !v.activo}
              onPress={() => v && onSelect(v.id)}
            />
          );
        })}
      </Fila>
    </View>
  );
}

function Fila({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function Chip({ label, active, disabled, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-w-[48px] items-center px-3.5 py-2 rounded-xl border ${
        active ? 'bg-primary border-primary' : 'bg-card border-border/70'
      } ${disabled ? 'opacity-30' : ''}`}
    >
      <Text
        className={`text-xs font-semibold ${active ? 'text-primary-foreground' : 'text-foreground'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
