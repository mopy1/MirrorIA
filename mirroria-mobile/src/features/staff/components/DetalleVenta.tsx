import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatMoney } from '@/src/lib/money';
import { HojaInferior } from '@/src/features/mostrador/components/HojaInferior';
import { codigoCorto } from '../lib/codigo';
import { canalVenta, ESTADO_VENTA } from '../lib/etiquetas';
import type { Venta } from '../types/staff.types';
import { EstadoBadge } from './EstadoBadge';

function Fila({ label, valor, fuerte }: { label: string; valor: string; fuerte?: boolean }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className={fuerte ? 'text-base font-bold' : 'text-sm'}>{valor}</Text>
    </View>
  );
}

/** Detalle de una venta: qué se vendió, a qué precio, descuentos y de dónde vino. */
export function DetalleVenta({
  venta,
  sucursal,
  nombre,
  onCerrar,
}: {
  venta: Venta | null;
  sucursal: (id: string) => string;
  nombre: (varianteId: string) => string;
  onCerrar: () => void;
}) {
  const v = venta;
  const estado = v ? ESTADO_VENTA[v.estado] ?? { label: v.estado, tono: 'gris' as const } : null;
  return (
    <HojaInferior visible={!!v} titulo={v ? (v.numeroComprobante ?? `#${codigoCorto(v.id)}`) : ''} onCerrar={onCerrar}>
      {v && estado ? (
        <>
          <EstadoBadge label={estado.label} tono={estado.tono} />
          <View className="gap-1.5">
            <Fila label="Fecha" valor={new Date(v.createdAt).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })} />
            <Fila label="Sucursal" valor={sucursal(v.sucursalId)} />
            <Fila label="Canal" valor={canalVenta(v.canal)} />
            <Fila label="Clienta" valor={v.clienteId ? 'Registrada' : 'Sin registrar (mostrador)'} />
            {v.reservaId ? <Fila label="Reserva" valor={`#${codigoCorto(v.reservaId)}`} /> : null}
          </View>
          <View className="gap-2 border-t border-border pt-3">
            <Text className="text-sm font-semibold">Prendas</Text>
            {v.items.map((i) => (
              <View key={i.id} className="flex-row justify-between gap-3">
                <Text className="flex-1 text-sm">{i.cantidad} × {nombre(i.varianteId)}</Text>
                <Text className="text-sm">{formatMoney(i.subtotalCents)}</Text>
              </View>
            ))}
          </View>
          <View className="gap-1.5 border-t border-border pt-3">
            <Fila label="Subtotal" valor={formatMoney(v.subtotalCents)} />
            {v.descuentoCents > 0 ? <Fila label="Descuento (cupón)" valor={`− ${formatMoney(v.descuentoCents)}`} /> : null}
            <Fila label="Total" valor={formatMoney(v.totalCents)} fuerte />
          </View>
        </>
      ) : null}
    </HojaInferior>
  );
}
