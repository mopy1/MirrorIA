import { router } from 'expo-router';
import { CheckCircle } from 'phosphor-react-native';
import { ScrollView, View } from 'react-native';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Titulo } from '@/components/common/Titulo';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Diccionario } from '@/lib/db/repos/detalle.repo';
import { codigoCorto } from '@/lib/outbox/consultas';
import type { VentaDto } from '../api/pagos.api';

/** Éxito "Compra confirmada": comprobante, dónde retirar y salidas claras (pedido / seguir mirando). */
export function CompraConfirmada({ venta, dic }: { venta: VentaDto; dic: Diccionario | undefined }) {
  const sucursal = dic?.sucursales.get(venta.sucursalId);
  const prendas = venta.items.reduce((s, i) => s + i.cantidad, 0);
  return (
    <ScrollView contentContainerClassName="flex-grow justify-center gap-6 px-6 pb-10">
      <View className="items-center">
        <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-success/15">
          <Icon as={CheckCircle} size={44} weight="fill" className="text-success" />
        </View>
        <Titulo nivel="display" className="text-center">
          Compra confirmada
        </Titulo>
        <Text className="mt-2 max-w-xs text-center text-sm leading-5 text-muted-foreground">
          {venta.reservaId ? 'Lo que reservaste ya es tuyo.' : `${prendas === 1 ? 'Tu prenda te espera' : `Tus ${prendas} prendas te esperan`} en la sucursal.`}
        </Text>
      </View>
      <View className="gap-2 rounded-lg border border-dashed border-border bg-card p-5">
        <Fila etiqueta="Comprobante" valor={venta.numeroComprobante ?? codigoCorto(venta.id)} mono />
        {sucursal ? <Fila etiqueta="Retiro en" valor={sucursal.nombre} /> : null}
        <View className="flex-row items-baseline justify-between border-t border-dashed border-border pt-3">
          <Text className="font-body-semibold text-sm">Pagado</Text>
          <MonedaBs cents={venta.totalCents} className="text-xl" />
        </View>
      </View>
      <View className="gap-2">
        <Button size="lg" className="h-[52px]" onPress={() => router.navigate({ pathname: '/mis-cosas/pedidos/[ventaId]', params: { ventaId: venta.id } })}>
          <Text>Ver mi pedido</Text>
        </Button>
        <Button variant="ghost" onPress={() => router.navigate('/vitrina')}>
          <Text>Seguir mirando</Text>
        </Button>
      </View>
    </ScrollView>
  );
}

function Fila({ etiqueta, valor, mono }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-muted-foreground">{etiqueta}</Text>
      <Text className={mono ? 'font-mono text-sm' : 'font-body-medium text-sm'} selectable>
        {valor}
      </Text>
    </View>
  );
}
