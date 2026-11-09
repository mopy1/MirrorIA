import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatoBs } from '@/lib/formato/dinero';

interface Props {
  totalCents: number;
  unidades: number;
  /** Hay un checkout encolado sin confirmar: no se ofrece otro (el servidor compraría el mismo carrito). */
  compraEnCurso: boolean;
}

/** Total tipo ticket (borde punteado) + "Continuar" pegado abajo, también sin red. */
export function ResumenCarrito({ totalCents, unidades, compraEnCurso }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View className="border-t border-dashed border-border bg-background px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View className="mb-3 flex-row items-baseline justify-between">
        <Text className="text-sm text-muted-foreground">
          {unidades} {unidades === 1 ? 'prenda' : 'prendas'}
        </Text>
        <MonedaBs cents={totalCents} className="text-lg" />
      </View>
      <Button size="lg" className="h-[52px]" disabled={compraEnCurso} onPress={() => router.push('/carrito/checkout')}>
        <Text>Continuar · {formatoBs(totalCents)}</Text>
      </Button>
      {compraEnCurso ? (
        <Text className="mt-2 text-center text-xs text-muted-foreground">Ya tenés una compra esperando confirmación con estas prendas.</Text>
      ) : null}
    </View>
  );
}
