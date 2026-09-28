import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { sucursalesApi } from '@/src/features/sucursales/api/sucursalesApi';
import type { SucursalResponseDto } from '@/src/features/sucursales/types/sucursales.types';

interface Slot {
  label: string;
  hoursFromNow: number;
}

const SLOTS: Slot[] = [
  { label: 'Hoy en 2 hs', hoursFromNow: 2 },
  { label: 'Hoy en 4 hs', hoursFromNow: 4 },
  { label: 'Mañana 10:00', hoursFromNow: 24 },
  { label: 'Mañana 16:00', hoursFromNow: 30 },
];

interface ReservarEnTiendaSheetProps {
  onConfirm: (sucursalId: string, fechaHoraPrevista: string) => void;
  isSubmitting: boolean;
}

export function ReservarEnTiendaSheet({
  onConfirm,
  isSubmitting,
}: ReservarEnTiendaSheetProps) {
  const [sucursales, setSucursales] = useState<SucursalResponseDto[]>([]);
  const [sucursalId, setSucursalId] = useState<string | null>(null);
  const [slotIndex, setSlotIndex] = useState<number | null>(null);

  useEffect(() => {
    sucursalesApi
      .getSucursales()
      .then((data) => {
        const activas = data.filter((s) => s.activo);
        setSucursales(activas);
        if (activas.length === 1) setSucursalId(activas[0].id);
      })
      .catch(() => setSucursales([]));
  }, []);

  const puedeConfirmar = sucursalId !== null && slotIndex !== null && !isSubmitting;

  return (
    <View className="gap-4 p-4 rounded-2xl bg-muted/30 border border-border/60">
      <View className="gap-2">
        <Text className="text-xs font-bold text-foreground">Sucursal</Text>
        <View className="flex-row flex-wrap gap-2">
          {sucursales.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setSucursalId(s.id)}
              className={`px-3 py-1.5 rounded-lg border ${
                sucursalId === s.id
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border/70'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  sucursalId === s.id ? 'text-primary-foreground' : 'text-foreground'
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

      <View className="gap-2">
        <Text className="text-xs font-bold text-foreground">¿Cuándo?</Text>
        <View className="flex-row flex-wrap gap-2">
          {SLOTS.map((slot, i) => (
            <Pressable
              key={slot.label}
              onPress={() => setSlotIndex(i)}
              className={`px-3 py-1.5 rounded-lg border ${
                slotIndex === i
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border/70'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  slotIndex === i ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {slot.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        size="sm"
        disabled={!puedeConfirmar}
        onPress={() => {
          if (!sucursalId || slotIndex === null) return;
          const fecha = new Date(
            Date.now() + SLOTS[slotIndex].hoursFromNow * 60 * 60 * 1000,
          );
          onConfirm(sucursalId, fecha.toISOString());
        }}
      >
        <Text>{isSubmitting ? 'Reservando…' : 'Confirmar reserva'}</Text>
      </Button>
    </View>
  );
}
