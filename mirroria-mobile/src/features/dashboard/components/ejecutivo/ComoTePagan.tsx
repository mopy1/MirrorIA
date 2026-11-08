import React from 'react';
import { View } from 'react-native';
import { Seccion } from '@/components/admin/Seccion';
import { Text } from '@/components/ui/text';
import { formatearMontoBs } from '../../lib/dashboard.utils';
import { agruparPagosPorMetodo } from '../../lib/metodos-pago';
import type { DistribucionPagoDto } from '../../types/dashboard.types';

/** Barra apilada por método de cobro + leyenda con nombre humano, monto y cantidad de cobros. */
export function ComoTePagan({ pagos }: { pagos: DistribucionPagoDto[] }) {
  const metodos = agruparPagosPorMetodo(pagos).filter((m) => m.montoBs > 0);
  if (metodos.length === 0) {
    return (
      <Seccion titulo="Cómo te pagan">
        <Text className="text-sm text-muted-foreground">
          Cuando cobres ventas en estas fechas, aquí vas a ver cuánto entró en efectivo, con tarjeta
          y por QR.
        </Text>
      </Seccion>
    );
  }
  const principal = [...metodos].sort((a, b) => b.montoBs - a.montoBs)[0];
  return (
    <Seccion titulo="Cómo te pagan">
      <Text className="text-sm text-muted-foreground">
        La mayor parte entró con {principal.nombre.toLowerCase()} ({principal.porcentaje}%).
      </Text>
      <View className="h-3 flex-row gap-0.5 overflow-hidden rounded-full">
        {metodos.map((m) => (
          <View
            key={m.clave}
            style={{ flexGrow: m.montoBs, flexBasis: 0, backgroundColor: m.color, minWidth: 4 }}
          />
        ))}
      </View>
      <View className="gap-3">
        {metodos.map((m) => (
          <View key={m.clave} className="flex-row items-start justify-between gap-3">
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
              <Text className="text-sm font-medium">{m.nombre}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-semibold">{formatearMontoBs(m.montoBs)}</Text>
              <Text className="text-xs text-muted-foreground">
                {m.porcentaje}% · {m.transacciones} {m.transacciones === 1 ? 'cobro' : 'cobros'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Seccion>
  );
}
