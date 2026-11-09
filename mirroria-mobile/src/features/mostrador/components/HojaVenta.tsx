import React, { useState } from 'react';
import { View } from 'react-native';
import { CircleAlert, Ticket } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { formatMoney } from '@/src/lib/money';
import { Aviso } from '@/src/features/staff/components/Aviso';
import { aCentavos, cambio } from '../lib/efectivo';
import { totalCents, type ClientaVenta, type LineaVenta } from '../lib/venta-caja';
import { HojaInferior } from './HojaInferior';
import { LineaCaja } from './LineaCaja';

interface Props {
  visible: boolean;
  lineas: LineaVenta[];
  clienta: ClientaVenta | null;
  maximo: (varianteId: string) => number;
  enLinea: boolean;
  cobrando: boolean;
  error: string | null;
  onSumar: (l: LineaVenta) => void;
  onRestar: (varianteId: string) => void;
  onQuitar: (varianteId: string) => void;
  onCobrar: () => void;
  onCerrar: () => void;
}

/** La venta actual: cantidades, total, cuánto paga en efectivo y el cambio. */
export function HojaVenta(p: Props) {
  const [pagaCon, setPagaCon] = useState('');
  const total = totalCents(p.lineas);
  const vuelto = cambio(aCentavos(pagaCon), total);
  const falta = aCentavos(pagaCon) !== null && vuelto === null;

  return (
    <HojaInferior
      visible={p.visible}
      titulo="Venta actual"
      onCerrar={p.onCerrar}
      pie={
        <>
          <View className="flex-row items-baseline justify-between">
            <Text className="text-sm text-muted-foreground">Total</Text>
            <Text className="text-3xl font-bold">{formatMoney(total)}</Text>
          </View>
          <Button size="lg" className="h-14" disabled={p.cobrando || p.lineas.length === 0} onPress={p.onCobrar}>
            <Text className="text-base">{p.cobrando ? 'Registrando…' : p.enLinea ? 'Cobrar en efectivo' : 'Cobrar en efectivo (sin conexión)'}</Text>
          </Button>
        </>
      }
    >
      {p.clienta ? (
        <Aviso tono="info" icono={Ticket}>
          {`Cobro de la reserva #${p.clienta.codigo}. La venta queda a nombre de la clienta y la reserva se cierra sola.`}
        </Aviso>
      ) : null}
      {p.lineas.length === 0 ? <Text className="text-sm text-muted-foreground">Tocá una prenda para agregarla.</Text> : null}
      {p.lineas.map((l) => (
        <LineaCaja
          key={l.item.varianteId}
          linea={l}
          maximo={p.maximo(l.item.varianteId)}
          onSumar={() => p.onSumar(l)}
          onRestar={() => p.onRestar(l.item.varianteId)}
          onQuitar={() => p.onQuitar(l.item.varianteId)}
        />
      ))}
      {p.lineas.length > 0 ? (
        <View className="gap-1.5">
          <Label nativeID="paga-con">Paga con (opcional)</Label>
          <Input
            aria-labelledby="paga-con"
            value={pagaCon}
            onChangeText={setPagaCon}
            placeholder="Ej. 500"
            keyboardType="decimal-pad"
            inputMode="decimal"
          />
          {vuelto !== null ? <Text className="text-base font-semibold text-emerald-700">Cambio: {formatMoney(vuelto)}</Text> : null}
          {falta ? <Text className="text-sm text-destructive">No alcanza para el total.</Text> : null}
        </View>
      ) : null}
      {p.error ? (
        <Aviso tono="error" icono={CircleAlert}>
          {p.error}
        </Aviso>
      ) : null}
    </HojaInferior>
  );
}
