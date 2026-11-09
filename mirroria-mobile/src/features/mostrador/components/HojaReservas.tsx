import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { CalendarClock, ChevronRight } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { Reserva } from '@/src/features/staff/types/staff.types';
import { codigoCorto, coincideCodigo } from '@/src/features/staff/lib/codigo';
import { HojaInferior } from './HojaInferior';

/** Elegir la reserva que se cobra (clienta en tienda). Así la venta queda a su nombre. */
export function HojaReservas({
  visible,
  reservas,
  onElegir,
  onCerrar,
}: {
  visible: boolean;
  reservas: Reserva[];
  onElegir: (r: Reserva) => void;
  onCerrar: () => void;
}) {
  const [codigo, setCodigo] = useState('');
  const visibles = reservas.filter((r) => coincideCodigo(r.id, codigo));
  return (
    <HojaInferior visible={visible} titulo="Cobrar una reserva" onCerrar={onCerrar}>
      <Text className="text-sm text-muted-foreground">
        Solo aparecen las reservas con la clienta en tienda. Si no está, marcá «Cliente llegó» en Reservas.
      </Text>
      <Input value={codigo} onChangeText={setCodigo} placeholder="Código de la clienta (ej. D6018924)" autoCapitalize="characters" />
      {visibles.length === 0 ? <Text className="py-6 text-center text-sm text-muted-foreground">No hay reservas para cobrar.</Text> : null}
      {visibles.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => onElegir(r)}
          accessibilityRole="button"
          className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5 active:bg-muted"
        >
          <Icon as={CalendarClock} size={20} className="text-primary" />
          <View className="flex-1">
            <Text className="font-mono text-base font-semibold tracking-wider">#{codigoCorto(r.id)}</Text>
            <Text className="text-sm text-muted-foreground">
              {r.items.reduce((a, i) => a + i.cantidad, 0)} prendas ·{' '}
              {new Date(r.fechaHoraPrevista).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
        </Pressable>
      ))}
    </HojaInferior>
  );
}
