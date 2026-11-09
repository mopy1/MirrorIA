import React from 'react';
import { View } from 'react-native';
import { CircleX } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatMoney } from '@/src/lib/money';
import type { VentaCaja } from '@/src/lib/offline/colaCaja';
import { Aviso } from '@/src/features/staff/components/Aviso';
import { avisoFallida } from '../lib/venta-caja';

/** Ventas sin conexión que el servidor rechazó. Quedan a la vista hasta que la cajera las resuelve. */
export function AvisosFallidas({ fallidas, onAtender }: { fallidas: VentaCaja[]; onAtender: (id: string) => void }) {
  if (fallidas.length === 0) return null;
  return (
    <View className="gap-2">
      {fallidas.map((v) => (
        <Aviso
          key={v.id}
          tono="error"
          icono={CircleX}
          accion={
            <Button size="sm" variant="outline" onPress={() => onAtender(v.id)} className="self-start">
              <Text>Ya lo resolví</Text>
            </Button>
          }
        >
          <Text className="text-sm font-semibold text-destructive">Venta no registrada</Text>
          <Text className="text-sm leading-5 text-destructive">{avisoFallida(v, formatMoney)}</Text>
        </Aviso>
      ))}
    </View>
  );
}
