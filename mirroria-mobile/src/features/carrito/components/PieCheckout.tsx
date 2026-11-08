import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { formatoBs } from '@/lib/formato/dinero';

interface Props {
  subtotalCents: number;
  descuentoCents: number;
  totalCents: number;
  online: boolean;
  enviando: boolean;
  deshabilitado: boolean;
  onConfirmar: () => void;
}

/** Ticket (subtotal, descuento, total) + "Confirmar compra" pegado abajo con el monto adentro. */
export function PieCheckout(p: Props) {
  const insets = useSafeAreaInsets();
  const { colores } = useTema();
  return (
    <View className="border-t border-dashed border-border bg-background px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View className="mb-1 flex-row justify-between">
        <Text className="text-sm text-muted-foreground">Subtotal</Text>
        <MonedaBs cents={p.subtotalCents} className="text-muted-foreground" />
      </View>
      {p.descuentoCents > 0 ? (
        <View className="mb-1 flex-row justify-between">
          <Text className="text-sm text-success">Cupón</Text>
          <Text className="font-mono text-sm text-success">−{formatoBs(p.descuentoCents)}</Text>
        </View>
      ) : null}
      <View className="mb-3 flex-row items-baseline justify-between">
        <Text className="font-body-semibold text-sm">Total</Text>
        <MonedaBs cents={p.totalCents} className="text-lg" />
      </View>
      <Button size="lg" className="h-[52px]" disabled={p.deshabilitado || p.enviando} onPress={p.onConfirmar}>
        {p.enviando ? <ActivityIndicator color={colores['primary-foreground']} /> : null}
        <Text>Confirmar compra · {formatoBs(p.totalCents)}</Text>
      </Button>
      <Text className="mt-2 text-center text-xs leading-4 text-muted-foreground">
        {p.online ? 'No pagás ahora: pagás cuando la tienda confirme el pedido.' : 'Sin conexión: queda “Pendiente de confirmar” y no se cobra nada hasta que vuelva la red.'}
      </Text>
    </View>
  );
}
