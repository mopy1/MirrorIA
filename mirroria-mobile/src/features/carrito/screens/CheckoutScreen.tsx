import { router } from 'expo-router';
import { ShoppingBag } from 'phosphor-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { mensajeDeError } from '@/lib/api/errores';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import { CampoCupon } from '../components/CampoCupon';
import { LineasCompra } from '../components/LineasCompra';
import { PieCheckout } from '../components/PieCheckout';
import { SelectorSucursalRetiro } from '../components/SelectorSucursalRetiro';
import { useCheckout } from '../hooks/use-checkout';

const Seccion = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <View className="gap-3">
    <Text className="font-body-semibold text-xs uppercase tracking-wider text-muted-foreground">{titulo}</Text>
    {children}
  </View>
);

/** `carrito/checkout`: confirmar la compra (encolable, RN09). El pago va después y solo con red (RN08). */
export default function CheckoutScreen() {
  const red = useEstadoRed();
  const c = useCheckout();

  let cuerpo: React.ReactNode;
  if (c.carrito.isPending) cuerpo = <View className="gap-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</View>;
  else if (c.items.length === 0)
    cuerpo = (
      <EstadoVacio icono={ShoppingBag} titulo="Tu carrito está vacío" texto="Agregá una prenda para poder comprarla.">
        <Button onPress={() => router.navigate('/vitrina')}>
          <Text>Ir a la vitrina</Text>
        </Button>
      </EstadoVacio>
    );
  else
    cuerpo = (
      <ScrollView contentContainerClassName="gap-7 px-5 pb-8 pt-2" keyboardShouldPersistTaps="handled">
        <Seccion titulo="Tus prendas">
          <LineasCompra lineas={c.items.map((i) => ({ prenda: i.nombre, talla: i.talla, color: i.color, cantidad: i.cantidad, precioCents: i.precioCents }))} />
        </Seccion>
        <Seccion titulo="Dónde la retirás">
          <SelectorSucursalRetiro opciones={c.opciones} elegida={c.sucursal?.sucursalId ?? null} onElegir={c.elegir} />
        </Seccion>
        <Seccion titulo="Cupón (opcional)">
          <CampoCupon subtotalCents={c.subtotal} online={red.online} aplicado={c.cupon} onAplicar={c.setCupon} />
        </Seccion>
        {c.confirmar.error ? <Text className="text-sm text-danger">{mensajeDeError(c.confirmar.error)}</Text> : null}
      </ScrollView>
    );

  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Confirmar compra" respaldo="/carrito" />
      <View className="flex-1">{cuerpo}</View>
      {c.items.length > 0 ? (
        <PieCheckout
          subtotalCents={c.subtotal}
          descuentoCents={c.cupon?.descuentoCents ?? 0}
          totalCents={c.total}
          online={red.online}
          enviando={c.confirmar.isPending}
          deshabilitado={!c.sucursal}
          onConfirmar={() => c.confirmar.mutate()}
        />
      ) : null}
    </Pantalla>
  );
}
