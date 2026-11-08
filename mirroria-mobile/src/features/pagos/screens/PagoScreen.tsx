import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { Prohibit } from 'phosphor-react-native';
import * as React from 'react';
import { ScrollView, View, type ScrollViewInstance } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoError } from '@/components/common/EstadoError';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useDiccionario } from '@/features/espejo/hooks/use-diccionario';
import { mensajeDeError } from '@/lib/api/errores';
import { CancelarCompra } from '../components/CancelarCompra';
import { CompraConfirmada } from '../components/CompraConfirmada';
import { PanelMetodo } from '../components/PanelMetodo';
import { PiePago } from '../components/PiePago';
import { ResumenPedido } from '../components/ResumenPedido';
import { SelectorMetodoPago } from '../components/SelectorMetodoPago';
import { usePago } from '../hooks/use-pago';

/**
 * `carrito/pago/[ventaId]` y `mis-cosas/pago/[ventaId]` (M3.1): QR Wayra con polling, Stripe en el
 * navegador o "Pagar en caja". Solo con red (RN08). Montada en dos tabs para que "← Volver" quede donde empezó.
 */
export default function PagoScreen() {
  const { ventaId } = useLocalSearchParams<{ ventaId: string }>();
  const enMisCosas = usePathname().startsWith('/mis-cosas');
  const p = usePago(ventaId);
  const dic = useDiccionario().data;
  const v = p.venta.data;
  // Al iniciar un cobro, el QR o el código de caja quedan a la vista (debajo del selector).
  const scroll = React.useRef<ScrollViewInstance>(null);
  const cobroVisible = p.cobro?.metodo === p.metodo ? p.cobro?.metodo : null;
  React.useEffect(() => {
    if (cobroVisible) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 250);
  }, [cobroVisible]);

  let cuerpo: React.ReactNode;
  if (p.venta.isPending) cuerpo = <View className="gap-3 p-5">{[120, 64, 64, 64].map((h, i) => <Skeleton key={i} style={{ height: h }} />)}</View>;
  else if (!v) cuerpo = <EstadoError error={p.venta.error} onReintentar={() => void p.venta.refetch()} />;
  else if (p.vista === 'PAGADA') cuerpo = <CompraConfirmada venta={v} dic={dic} />;
  else if (p.vista === 'CANCELADA')
    cuerpo = (
      <EstadoVacio icono={Prohibit} titulo="Esta compra se canceló" texto="No se te cobró nada. Si todavía querés las prendas, volvé a comprarlas.">
        <Button onPress={() => router.navigate('/vitrina')}>
          <Text>Ir a la vitrina</Text>
        </Button>
      </EstadoVacio>
    );
  else
    cuerpo = (
      <ScrollView ref={scroll} contentContainerClassName="gap-6 px-5 pb-6 pt-2">
        <ResumenPedido venta={v} dic={dic} />
        <View className="gap-3">
          <Text className="font-body-semibold text-xs uppercase tracking-wider text-muted-foreground">Cómo vas a pagar</Text>
          <SelectorMetodoPago metodos={p.metodos} elegido={p.metodo} onElegir={p.elegir} deshabilitado={!p.online || p.iniciar.isPending} />
          {p.metodo ? <PanelMetodo metodo={p.metodo} cobro={p.cobro} estadoQr={p.estadoQr} sucursal={dic?.sucursales.get(v.sucursalId)?.nombre} online={p.online} /> : null}
        </View>
        <CancelarCompra desdeReserva={!!v.reservaId} deshabilitado={!p.online || p.cancelar.isPending} onConfirmar={() => p.cancelar.mutate()} />
      </ScrollView>
    );

  const enCurso = !!v && p.vista !== 'PAGADA' && p.vista !== 'CANCELADA';
  const error = p.iniciar.error ?? p.cancelar.error;
  return (
    <Pantalla>
      <EncabezadoPantalla titulo={p.vista === 'PAGADA' ? undefined : 'Pagar'} respaldo={enMisCosas ? '/mis-cosas/pedidos' : '/carrito'} />
      <View className="flex-1">{cuerpo}</View>
      {enCurso ? (
        <PiePago
          metodo={p.metodo}
          iniciado={!!p.cobro && p.cobro.metodo === p.metodo}
          vista={p.vista}
          totalCents={v.totalCents}
          bloqueo={p.bloqueo}
          cargando={p.iniciar.isPending}
          error={error ? mensajeDeError(error) : null}
          onIniciar={() => p.metodo && p.iniciar.mutate(p.metodo)}
          onRevisar={p.revisar}
          onEntendido={() => router.navigate('/mis-cosas/pedidos')}
        />
      ) : null}
    </Pantalla>
  );
}
