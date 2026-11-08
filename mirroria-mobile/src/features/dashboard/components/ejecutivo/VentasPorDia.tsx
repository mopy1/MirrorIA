import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { LineaTendencia } from '@/components/admin/Graficos';
import { Seccion } from '@/components/admin/Seccion';
import { Text } from '@/components/ui/text';
import { formatearMontoBs } from '../../lib/dashboard.utils';
import { fechaCorta } from '../../lib/fechas-dashboard';
import { mejorDia, tendenciaAPuntos } from '../../lib/graficos';
import type { TendenciaIngresoDiaDto } from '../../types/dashboard.types';

const compras = (n: number) => `${n} ${n === 1 ? 'compra' : 'compras'}`;

/** Tendencia de ingresos por día, con el mejor día en palabras y los números a un toque. */
export function VentasPorDia({ dias }: { dias: TendenciaIngresoDiaDto[] }) {
  const [verNumeros, setVerNumeros] = useState(false);
  const mejor = mejorDia(dias);

  if (!mejor) {
    return (
      <Seccion titulo="Ventas por día">
        <Text className="text-sm text-muted-foreground">
          No hubo ventas en estas fechas. Probá con un período más largo, o registrá una venta para
          empezar a ver cómo se mueve tu tienda día a día.
        </Text>
      </Seccion>
    );
  }
  if (dias.length < 2) {
    return (
      <Seccion titulo="Ventas por día">
        <Text className="text-sm">
          Hoy llevás {formatearMontoBs(mejor.ingresosBs)} en {compras(mejor.ventas)}.
        </Text>
        <Text className="text-xs text-muted-foreground">
          Elegí 7 días o más para ver cómo cambian tus ventas de un día a otro.
        </Text>
      </Seccion>
    );
  }
  return (
    <Seccion titulo="Ventas por día">
      <Text className="text-sm text-muted-foreground">
        Tu mejor día fue el {fechaCorta(mejor.fecha)}: {formatearMontoBs(mejor.ingresosBs)} en{' '}
        {compras(mejor.ventas)}.
      </Text>
      <LineaTendencia datos={tendenciaAPuntos(dias)} />
      <Pressable onPress={() => setVerNumeros((v) => !v)} hitSlop={8} className="self-start py-1">
        <Text className="text-sm font-medium text-primary">
          {verNumeros ? 'Ocultar los números' : 'Ver los números de cada día'}
        </Text>
      </Pressable>
      {verNumeros ? (
        <View className="gap-1">
          {dias.map((d) => (
            <View key={d.fecha} className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">{fechaCorta(d.fecha)}</Text>
              <Text className="text-xs">
                {formatearMontoBs(d.ingresosBs)} · {compras(d.ventas)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Seccion>
  );
}
