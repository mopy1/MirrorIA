import { useLocalSearchParams } from 'expo-router';
import { CloudSlash, Storefront } from 'phosphor-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoError } from '@/components/common/EstadoError';
import { Pantalla } from '@/components/common/Pantalla';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useTienda } from '@/contexts/TiendaContext';
import { CampoCupon } from '@/features/carrito/components/CampoCupon';
import { reservaActiva } from '@/lib/reservas/comprar-reserva';
import { DetallesReserva } from '../components/DetallesReserva';
import { PaseQr } from '../components/PaseQr';
import { PieAccionesPase } from '../components/PieAccionesPase';
import { usePase } from '../hooks/use-pase';

const AYUDA: Record<string, string> = {
  PENDIENTE: 'Al llegar, mostrá este pase en caja: la cajera busca tu código y te marca en la tienda.',
  CONFIRMADA: 'La tienda ya te espera. Al llegar, mostrá este pase en caja para que te marquen en la tienda.',
  EN_TIENDA: 'Ya estás en la tienda. Si te queda bien, compralo desde acá y pagá como prefieras.',
  COMPLETADA: 'Compraste lo que reservaste. ¡Gracias!',
};

/** `mis-cosas/reservas/[reservaId]`: Pase de Tienda (D11) + "Comprar lo que reservé" con la reserva EN_TIENDA. */
export default function PaseScreen() {
  const { reservaId } = useLocalSearchParams<{ reservaId: string }>();
  const { tienda } = useTienda();
  const p = usePase(reservaId);
  const [cupon, setCupon] = React.useState<{ codigo: string; descuentoCents: number } | null>(null);
  const r = p.reserva;

  let cuerpo: React.ReactNode;
  if (p.q.isPending) cuerpo = <View className="gap-4 p-5"><Skeleton style={{ height: 340 }} /><Skeleton style={{ height: 160 }} /></View>;
  else if (!r) cuerpo = <EstadoError error={p.q.error} onReintentar={() => void p.q.refetch()} />;
  else
    cuerpo = (
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-2" keyboardShouldPersistTaps="handled">
        {p.guardado ? (
          <View className="flex-row items-center gap-2 rounded-lg bg-warning/10 px-4 py-2.5">
            <Icon as={CloudSlash} size={16} className="text-warning" />
            <Text className="flex-1 text-xs text-warning">Sin conexión: el pase sirve igual; el estado se actualiza al volver la red.</Text>
          </View>
        ) : null}
        <PaseQr reservaId={r.id} estado={r.estado} tienda={tienda?.nombre ?? 'Tienda'} activo={reservaActiva(r.estado)} />
        {AYUDA[r.estado] ? (
          <View className="flex-row gap-3 rounded-lg bg-brand-accent/30 p-4">
            <Icon as={Storefront} size={20} weight="duotone" className="text-foreground" />
            <Text className="flex-1 text-sm leading-5">{AYUDA[r.estado]}</Text>
          </View>
        ) : null}
        <DetallesReserva reserva={r} dic={p.dic} />
        {p.accion?.tipo === 'COMPRAR' ? (
          <View className="gap-2">
            <Text className="font-body-semibold text-xs uppercase tracking-wider text-muted-foreground">Cupón (opcional)</Text>
            <CampoCupon subtotalCents={p.subtotalCents} online={p.online} aplicado={cupon} onAplicar={setCupon} />
          </View>
        ) : null}
      </ScrollView>
    );

  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Pase de tienda" respaldo="/mis-cosas/reservas" />
      <View className="flex-1">{cuerpo}</View>
      {r ? <PieAccionesPase p={p} cupon={cupon?.codigo} /> : null}
    </Pantalla>
  );
}
