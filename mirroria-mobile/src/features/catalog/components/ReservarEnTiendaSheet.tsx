import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ChipOpcion } from './ChipOpcion';
import { sucursalesApi } from '@/src/features/sucursales/api/sucursalesApi';
import { reservasApi } from '@/src/features/reservas/api/reservasApi';
import type { CupoReserva } from '@/src/features/reservas/types/reservas.types';
import type { SucursalResponseDto } from '@/src/features/sucursales/types/sucursales.types';

interface Slot {
  label: string;
  fecha: () => Date;
}

const enHoras = (h: number) => () => new Date(Date.now() + h * 3600_000);

// "Mañana 10:00" es mañana a las 10:00 hora local, no "ahora + 24 h" (así
// estaba antes: reservando a las 11:56 quedaba para mañana a las 11:56).
const mananaALas = (hora: number) => () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hora, 0, 0, 0);
  return d;
};

const SLOTS: Slot[] = [
  { label: 'Hoy en 2 hs', fecha: enHoras(2) },
  { label: 'Hoy en 4 hs', fecha: enHoras(4) },
  { label: 'Mañana 10:00', fecha: mananaALas(10) },
  { label: 'Mañana 16:00', fecha: mananaALas(16) },
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
  const [cupo, setCupo] = useState<CupoReserva | null>(null);

  useEffect(() => {
    reservasApi.getCupo().then(setCupo).catch(() => setCupo(null));
  }, []);

  // Solo se ofrecen horarios que el backend acepta (entre +30 min y +48 h).
  const slots = SLOTS.filter((slot) => {
    const minutos = (slot.fecha().getTime() - Date.now()) / 60_000;
    const min = cupo?.anticipacionMinimaMinutos ?? 30;
    const max = (cupo?.ventanaMaximaHoras ?? 48) * 60;
    return minutos >= min && minutos <= max;
  });

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

  if (cupo && !cupo.puedeReservar) {
    return (
      <View className="gap-2 p-4 rounded-2xl bg-muted/30 border border-border/60">
        <Text className="text-xs font-bold text-foreground">No podés reservar ahora</Text>
        <Text className="text-[11px] text-muted-foreground leading-relaxed">{cupo.motivo}</Text>
      </View>
    );
  }

  return (
    <View className="gap-4 p-4 rounded-2xl bg-muted/30 border border-border/60">
      <View className="gap-2">
        <Text className="text-xs font-bold text-foreground">Sucursal</Text>
        <View className="flex-row flex-wrap gap-2">
          {sucursales.map((s) => (
            <ChipOpcion
              key={s.id}
              label={s.nombre}
              activo={sucursalId === s.id}
              onPress={() => setSucursalId(s.id)}
            />
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
          {slots.map((slot, i) => (
            <ChipOpcion
              key={slot.label}
              label={slot.label}
              activo={slotIndex === i}
              onPress={() => setSlotIndex(i)}
            />
          ))}
        </View>
      </View>

      <Button
        size="sm"
        disabled={!puedeConfirmar}
        onPress={() => {
          if (!sucursalId || slotIndex === null) return;
          const fecha = slots[slotIndex].fecha();
          onConfirm(sucursalId, fecha.toISOString());
        }}
      >
        <Text>{isSubmitting ? 'Reservando…' : 'Confirmar reserva'}</Text>
      </Button>

      {cupo && (
        <Text className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Reservas activas: {cupo.reservasActivas} de {cupo.maxReservasActivas}. Si no llegás
          hasta {cupo.toleranciaMinutos} min después de la hora, la reserva vence sola y cuenta
          como falta ({cupo.faltasParaBloqueo} faltas bloquean nuevas reservas por un tiempo).
        </Text>
      )}
    </View>
  );
}
