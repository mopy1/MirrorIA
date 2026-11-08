import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { codigoCorto } from '../lib/codigo';
import { ESTADO_RESERVA, TRANSICIONES, type AccionReserva } from '../lib/etiquetas';
import type { Reserva } from '../types/staff.types';
import { EstadoBadge } from './EstadoBadge';

interface Props {
  reserva: Reserva;
  sucursal: string | null;
  nombre: (varianteId: string) => string;
  ocupada: boolean;
  puedeCobrar: boolean;
  onCambiar: (estado: string) => void;
  onCobrar: () => void;
}

/** Una cita de la agenda: código, hora, prendas y las transiciones que permite su estado. */
export function TarjetaReserva({ reserva: r, sucursal, nombre, ocupada, puedeCobrar, onCambiar, onCobrar }: Props) {
  // Lo que no tiene vuelta atrás (cancelar, expirar, no asistió) pide un segundo toque.
  const [porConfirmar, setPorConfirmar] = useState<AccionReserva | null>(null);
  const e = ESTADO_RESERVA[r.estado] ?? { label: r.estado, tono: 'gris' as const };
  const acciones = TRANSICIONES[r.estado] ?? [];
  const hora = new Date(r.fechaHoraPrevista).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

  function tocar(a: AccionReserva) {
    if (a.tipo === 'principal' || a.estado === 'EN_TIENDA') return onCambiar(a.estado);
    setPorConfirmar(a);
  }

  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="gap-0.5">
          <Text className="text-xl font-bold">{hora}</Text>
          <Text className="font-mono text-sm font-semibold tracking-wider">#{codigoCorto(r.id)}</Text>
          {sucursal ? <Text className="text-xs text-muted-foreground">{sucursal}</Text> : null}
        </View>
        <EstadoBadge label={e.label} tono={e.tono} />
      </View>
      <View className="gap-0.5">
        {r.items.map((i) => (
          <Text key={i.id} className="text-sm text-muted-foreground">{i.cantidad} × {nombre(i.varianteId)}</Text>
        ))}
      </View>
      {porConfirmar ? (
        <View className="gap-2">
          <Text className="text-sm">¿Marcar la reserva #{codigoCorto(r.id)} como «{porConfirmar.label}»? No se puede deshacer.</Text>
          <View className="flex-row gap-2">
            <Button variant={porConfirmar.tipo === 'peligro' ? 'destructive' : 'default'} className="flex-1 h-11" disabled={ocupada}
              onPress={() => { onCambiar(porConfirmar.estado); setPorConfirmar(null); }}>
              <Text className="text-white">Sí, {porConfirmar.label.toLowerCase()}</Text>
            </Button>
            <Button variant="outline" className="h-11" onPress={() => setPorConfirmar(null)}><Text>No</Text></Button>
          </View>
        </View>
      ) : acciones.length > 0 || (puedeCobrar && r.estado === 'EN_TIENDA') ? (
        <View className="flex-row flex-wrap gap-2">
          {puedeCobrar && r.estado === 'EN_TIENDA' ? (
            <Button className="h-11 bg-emerald-600" disabled={ocupada} onPress={onCobrar}><Text className="text-white">Cobrar en caja</Text></Button>
          ) : null}
          {acciones.map((a) => (
            <Button key={a.estado} variant={a.tipo === 'principal' ? 'default' : 'outline'} className="h-11" disabled={ocupada} onPress={() => tocar(a)}>
              <Text className={cn(a.tipo === 'peligro' && 'text-destructive')}>{a.label}</Text>
            </Button>
          ))}
        </View>
      ) : null}
    </View>
  );
}
