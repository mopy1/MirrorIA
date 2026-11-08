import { router, useLocalSearchParams } from 'expo-router';
import { Bank, CreditCard, Money, QrCode, type Icon as PhosphorIcon } from 'phosphor-react-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Pantalla } from '@/components/common/Pantalla';
import { Titulo } from '@/components/common/Titulo';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

const METODOS: { icono: PhosphorIcon; titulo: string; detalle: string }[] = [
  { icono: QrCode, titulo: 'QR Wayra', detalle: 'Escaneás el QR con tu banco y la pantalla cambia sola' },
  { icono: CreditCard, titulo: 'Tarjeta', detalle: 'Pago seguro con Stripe en el navegador' },
  { icono: Money, titulo: 'Efectivo en caja', detalle: 'Le decís tu código a la cajera al retirar' },
];

/** `carrito/pago/[ventaId]`: solo con red (RN08). Los métodos llegan en M3; la venta ya está apartada. */
export default function PagoScreen() {
  const { ventaId, total } = useLocalSearchParams<{ ventaId: string; total?: string }>();
  const insets = useSafeAreaInsets();
  const codigo = `#${(ventaId ?? '').slice(0, 8).toUpperCase()}`;
  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Pagar" respaldo="/carrito" />
      <ScrollView contentContainerClassName="gap-6 px-5 pb-8 pt-2">
        <View className="rounded-lg border border-dashed border-border bg-card p-5">
          <Text className="text-xs text-muted-foreground">Pedido</Text>
          <Text className="font-mono text-2xl" selectable>
            {codigo}
          </Text>
          <View className="mt-3 flex-row items-baseline justify-between border-t border-dashed border-border pt-3">
            <Text className="font-body-semibold text-sm">A pagar</Text>
            <MonedaBs cents={Number(total ?? 0)} className="text-xl" />
          </View>
        </View>
        <View className="gap-2">
          <Titulo nivel="h3">Cómo vas a pagar</Titulo>
          {METODOS.map((m) => (
            <View key={m.titulo} className="min-h-14 flex-row items-center gap-3 rounded-lg border border-border px-4 py-3 opacity-60">
              <Icon as={m.icono} size={22} weight="duotone" className="text-primary" />
              <View className="flex-1">
                <Text className="font-body-medium text-sm">{m.titulo}</Text>
                <Text className="text-xs text-muted-foreground">{m.detalle}</Text>
              </View>
            </View>
          ))}
        </View>
        <View className="flex-row gap-3 rounded-lg bg-brand-accent/30 p-4">
          <Icon as={Bank} size={20} weight="duotone" className="text-foreground" />
          <Text className="flex-1 text-sm leading-5">
            El pago desde la app llega en la próxima versión. Tus prendas ya están apartadas: podés pagar este pedido desde la web, en Mis pedidos.
          </Text>
        </View>
      </ScrollView>
      <View className="border-t border-border px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <Button size="lg" className="h-[52px]" onPress={() => router.navigate('/carrito')}>
          <Text>Entendido</Text>
        </Button>
      </View>
    </Pantalla>
  );
}
