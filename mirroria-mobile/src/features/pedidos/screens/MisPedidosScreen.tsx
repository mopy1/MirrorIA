import { router } from 'expo-router';
import { Receipt } from 'phosphor-react-native';
import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { BadgeEstadoOutbox } from '@/components/common/BadgeEstadoOutbox';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoError } from '@/components/common/EstadoError';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useDiccionario } from '@/features/espejo/hooks/use-diccionario';
import { enCurso } from '@/lib/outbox/consultas';
import { useOutbox } from '@/lib/outbox/use-outbox';
import { TarjetaPedido } from '../components/TarjetaPedido';
import { useMisVentas } from '../hooks/use-mis-ventas';

/** `mis-cosas/pedidos`: compras del servidor + las compras sin enviar de la outbox (RN09). */
export default function MisPedidosScreen() {
  const q = useMisVentas();
  const dic = useDiccionario().data;
  const encoladas = useOutbox().mias.filter((f) => f.tipo === 'CHECKOUT' && enCurso(f));
  const ventas = q.data?.datos ?? [];
  const resumen = (ids: string[]) => {
    const p = dic?.variantes.get(ids[0]);
    return `${p?.prenda ?? 'Compra'}${ids.length > 1 ? ` y ${ids.length - 1} más` : ''}`;
  };

  let cuerpo: React.ReactNode;
  if (q.isPending) cuerpo = [0, 1, 2].map((i) => <Skeleton key={i} style={{ height: 104 }} />);
  else if (q.isError && encoladas.length === 0) cuerpo = <EstadoError error={q.error} onReintentar={() => void q.refetch()} />;
  else if (ventas.length === 0 && encoladas.length === 0)
    cuerpo = (
      <EstadoVacio icono={Receipt} titulo="Aún no compraste" texto="Cuando compres, acá ves cada pedido con su estado de pago.">
        <Button onPress={() => router.navigate('/vitrina')}>
          <Text>Ir a la vitrina</Text>
        </Button>
      </EstadoVacio>
    );
  else
    cuerpo = (
      <>
        {encoladas.map((f) => (
          <Pressable key={f.id} accessibilityRole="button" className="gap-2 rounded-lg border border-dashed border-warning/60 bg-card p-4 active:bg-accent" onPress={() => router.push({ pathname: '/mis-cosas/pendientes/[outboxId]', params: { outboxId: f.id } })}>
            <BadgeEstadoOutbox estado={f.estado} />
            <View className="w-full flex-row justify-between">
              <Text className="flex-1 font-body-medium text-[15px]" numberOfLines={1}>{f.descripcion}</Text>
              {f.meta.totalCents !== undefined ? <MonedaBs cents={f.meta.totalCents} /> : null}
            </View>
          </Pressable>
        ))}
        {ventas.map((v) => (
          <TarjetaPedido key={v.id} venta={v} resumen={resumen(v.items.map((i) => i.varianteId))} onPress={() => router.push({ pathname: '/mis-cosas/pedidos/[ventaId]', params: { ventaId: v.id } })} />
        ))}
      </>
    );

  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Mis pedidos" respaldo="/mis-cosas" />
      <ScrollView contentContainerClassName="gap-3 px-5 pb-10 pt-1" refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />}>
        {q.data?.guardado ? <Text className="text-xs text-warning">Sin conexión: lo último guardado.</Text> : null}
        {cuerpo}
      </ScrollView>
    </Pantalla>
  );
}
