import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Clock, Ticket } from 'phosphor-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoError } from '@/components/common/EstadoError';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useDiccionario } from '@/features/espejo/hooks/use-diccionario';
import { ResumenPedido } from '@/features/pagos/components/ResumenPedido';
import { formatoBs } from '@/lib/formato/dinero';
import { fechaCortaLaPaz } from '@/lib/formato/fechas';
import { bloqueoPago, ventaPagada } from '@/lib/pagos/estado-pago';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import { BadgeEstadoVenta } from '../components/BadgeEstadoVenta';
import { useVenta } from '../hooks/use-mis-ventas';

/** `mis-cosas/pedidos/[ventaId]`: recibo + estado de pago; si falta pagar, "Pagar" (solo con red). */
export default function PedidoScreen() {
  const { ventaId } = useLocalSearchParams<{ ventaId: string }>();
  const insets = useSafeAreaInsets();
  const red = useEstadoRed();
  const q = useVenta(ventaId);
  const dic = useDiccionario().data;
  const { refetch } = q;
  useFocusEffect(React.useCallback(() => void refetch(), [refetch]));
  const v = q.data;
  const pagada = ventaPagada(v?.estado);
  const bloqueo = bloqueoPago(red.online, v?.estado);

  let cuerpo: React.ReactNode;
  if (q.isPending) cuerpo = <View className="gap-3 p-5"><Skeleton style={{ height: 220 }} /><Skeleton style={{ height: 64 }} /></View>;
  else if (!v) cuerpo = <EstadoError error={q.error} onReintentar={() => void q.refetch()} />;
  else
    cuerpo = (
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-2">
        <View className="flex-row items-center gap-3 rounded-lg bg-card p-4">
          <Icon as={pagada ? CheckCircle : Clock} size={28} weight="duotone" className={pagada ? 'text-success' : 'text-warning'} />
          <View className="flex-1 gap-1">
            <BadgeEstadoVenta estado={v.estado} />
            <Text className="text-xs text-muted-foreground">
              {pagada ? 'Pago acreditado. Retirá tus prendas con este comprobante.' : v.estado === 'PENDIENTE' ? 'Tus prendas están apartadas hasta que pagues.' : 'Esta compra no se cobró.'}
            </Text>
          </View>
        </View>
        <ResumenPedido venta={v} dic={dic} />
        <Text className="text-xs text-muted-foreground">Hecho el {fechaCortaLaPaz(Date.parse(v.createdAt))} · {v.canal === 'MOVIL' ? 'desde la app' : v.canal === 'WEB' ? 'desde la web' : 'en la tienda'}</Text>
        {v.reservaId ? (
          <Button variant="outline" onPress={() => router.push({ pathname: '/mis-cosas/reservas/[reservaId]', params: { reservaId: v.reservaId! } })}>
            <Icon as={Ticket} size={18} />
            <Text>Ver la reserva</Text>
          </Button>
        ) : null}
      </ScrollView>
    );

  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Pedido" respaldo="/mis-cosas/pedidos" />
      <View className="flex-1">{cuerpo}</View>
      {v?.estado === 'PENDIENTE' ? (
        <View className="border-t border-border px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Button size="lg" className="h-[52px]" disabled={!!bloqueo} onPress={() => router.push({ pathname: '/mis-cosas/pago/[ventaId]', params: { ventaId: v.id } })}>
            <Text>Pagar · {formatoBs(v.totalCents)}</Text>
          </Button>
          {bloqueo ? <Text className="mt-2 text-center text-xs text-warning">{bloqueo}</Text> : null}
        </View>
      ) : null}
    </Pantalla>
  );
}
