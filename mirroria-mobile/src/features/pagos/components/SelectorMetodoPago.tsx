import * as Haptics from 'expo-haptics';
import { CreditCard, Money, QrCode } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { Icon, type PhosphorIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { MetodoPagoApp } from '@/lib/pagos/estado-pago';
import { cn } from '@/lib/utils';

export const INFO_METODO: Record<MetodoPagoApp, { icono: PhosphorIcon; titulo: string; detalle: string }> = {
  QR: { icono: QrCode, titulo: 'QR Wayra', detalle: 'Lo escaneás con tu banco y la pantalla cambia sola' },
  TARJETA: { icono: CreditCard, titulo: 'Tarjeta', detalle: 'Pago seguro con Stripe en el navegador' },
  EFECTIVO: { icono: Money, titulo: 'Pagar en caja', detalle: 'En efectivo, con tu código, al retirar en la sucursal' },
};

interface Props {
  metodos: MetodoPagoApp[];
  elegido: MetodoPagoApp | null;
  onElegir: (m: MetodoPagoApp) => void;
  deshabilitado: boolean;
}

/** Radio de 64 px con ícono: un método a la vez (el panel de abajo cambia). */
export function SelectorMetodoPago({ metodos, elegido, onElegir, deshabilitado }: Props) {
  return (
    <View className="gap-2" accessibilityRole="radiogroup">
      {metodos.map((m) => {
        const info = INFO_METODO[m];
        const activo = m === elegido;
        return (
          <Pressable
            key={m}
            disabled={deshabilitado}
            accessibilityRole="radio"
            accessibilityState={{ checked: activo, disabled: deshabilitado }}
            onPress={() => {
              void Haptics.selectionAsync();
              onElegir(m);
            }}
            className={cn('min-h-16 flex-row items-center gap-3 rounded-lg border px-4 py-3', activo ? 'border-primary bg-primary/5' : 'border-border', deshabilitado && 'opacity-50')}
          >
            <View className={cn('h-10 w-10 items-center justify-center rounded-full', activo ? 'bg-primary' : 'bg-muted')}>
              <Icon as={info.icono} size={20} weight={activo ? 'fill' : 'duotone'} className={activo ? 'text-primary-foreground' : 'text-foreground'} />
            </View>
            <View className="flex-1">
              <Text className="font-body-semibold text-sm">{info.titulo}</Text>
              <Text className="text-xs leading-4 text-muted-foreground">{info.detalle}</Text>
            </View>
            <View className={cn('h-5 w-5 items-center justify-center rounded-full border-2', activo ? 'border-primary' : 'border-muted-foreground/40')}>
              {activo ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
