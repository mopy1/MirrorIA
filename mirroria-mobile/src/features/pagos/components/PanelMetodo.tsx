import { ShieldCheck } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { EstadoCobroQr, MetodoPagoApp } from '@/lib/pagos/estado-pago';
import type { Cobro } from '../hooks/use-pago';
import { EsperandoPago } from './EsperandoPago';
import { PanelCaja } from './PanelCaja';
import { PanelQr } from './PanelQr';

const ANTES: Record<MetodoPagoApp, string> = {
  QR: 'Generamos un QR con el monto exacto. Lo pagás desde la app de tu banco y la compra se confirma sola.',
  TARJETA: 'Te abrimos la página segura de Stripe. Cuando termines, volvé a la app: revisamos el pago solos.',
  EFECTIVO: 'Te damos un código. Al retirar, se lo decís a la cajera y pagás en efectivo. Tus prendas quedan apartadas.',
};

interface Props {
  metodo: MetodoPagoApp;
  cobro: Cobro | null;
  estadoQr: EstadoCobroQr | null;
  sucursal?: string;
  online: boolean;
}

/** Lo que se ve debajo del selector: la explicación del método o el cobro ya iniciado. */
export function PanelMetodo({ metodo, cobro, estadoQr, sucursal, online }: Props) {
  if (cobro?.metodo === 'QR' && metodo === 'QR') return <PanelQr qr={cobro.qr} estado={estadoQr} online={online} />;
  if (cobro?.metodo === 'EFECTIVO' && metodo === 'EFECTIVO') return <PanelCaja caja={cobro.caja} sucursal={sucursal} online={online} />;
  if (cobro?.metodo === 'TARJETA' && metodo === 'TARJETA') {
    return (
      <View className="gap-3 rounded-lg border border-border bg-card p-5">
        <Text className="text-sm leading-5">Si ya pagaste con tu tarjeta, Stripe nos avisa en unos segundos y esta pantalla cambia sola.</Text>
        <EsperandoPago texto="Revisando tu pago con tarjeta…" />
      </View>
    );
  }
  return (
    <View className="flex-row gap-3 rounded-lg bg-muted/60 p-4">
      <Icon as={ShieldCheck} size={20} weight="duotone" className="text-primary" />
      <Text className="flex-1 text-sm leading-5 text-muted-foreground">{ANTES[metodo]}</Text>
    </View>
  );
}
